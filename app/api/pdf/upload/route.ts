/**
 * PDF Upload and Processing API - Phase 13
 * 
 * Handles PDF file uploads and processes them using GROBID
 * to extract metadata and citations.
 * 
 * @route POST /api/pdf/upload
 */

import { NextRequest, NextResponse } from 'next/server'
import { grobidClient } from '@/lib/pdf/grobid-client'
import { cachedCrossrefLookup } from '@/lib/cache/api-cache'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    // Check if GROBID service is available
    const isGrobidAvailable = await grobidClient.isAlive()
    if (!isGrobidAvailable) {
      return NextResponse.json(
        { 
          error: 'PDF processing service unavailable',
          message: 'GROBID service is not running. Please start it with: docker-compose up grobid'
        },
        { status: 503 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are accepted.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'File too large',
          message: `Maximum file size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
        },
        { status: 413 }
      )
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process with GROBID
    const startTime = Date.now()
    const metadata = await grobidClient.processFulltext(buffer)
    const processingTime = Date.now() - startTime

    if (!metadata) {
      return NextResponse.json(
        { error: 'PDF processing failed' },
        { status: 500 }
      )
    }

    // Enrich citations with Crossref data (for citations with DOIs)
    const enrichedCitations = await Promise.all(
      metadata.citations.map(async (citation) => {
        if (citation.doi && !citation.enriched) {
          try {
            const crossrefData = await cachedCrossrefLookup(citation.doi)
            return {
              ...citation,
              enriched: true,
              crossrefData: crossrefData ? {
                title: crossrefData.title?.[0],
                authors: crossrefData.author?.map(a => 
                  `${a.given || ''} ${a.family}`.trim()
                ),
                year: crossrefData['published-print']?.['date-parts']?.[0]?.[0],
                journal: crossrefData['container-title']?.[0],
                url: `https://doi.org/${crossrefData.DOI}`,
              } : null,
            }
          } catch (error) {
            console.error(`Failed to enrich citation with DOI ${citation.doi}:`, error)
            return citation
          }
        }
        return citation
      })
    )

    // Prepare response
    const response = {
      success: true,
      metadata: {
        title: metadata.title,
        authors: metadata.authors,
        abstract: metadata.abstract,
        date: metadata.date,
        journal: metadata.journal,
        doi: metadata.doi,
      },
      citations: enrichedCitations,
      stats: {
        totalCitations: enrichedCitations.length,
        enrichedCitations: enrichedCitations.filter(c => c.doi).length,
        processingTimeMs: processingTime,
      },
      processing: {
        filename: file.name,
        fileSize: file.size,
        processedAt: new Date().toISOString(),
      },
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('PDF upload error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Failed to process PDF',
        message: errorMessage
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check GROBID service status
export async function GET() {
  try {
    const isAlive = await grobidClient.isAlive()
    const version = await grobidClient.getVersion()

    return NextResponse.json({
      status: isAlive ? 'healthy' : 'unavailable',
      version,
      service: 'GROBID PDF Processing',
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
