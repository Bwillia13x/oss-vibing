/**
 * Research Tools API Endpoint
 * Unified endpoint for searching academic databases
 * GET /api/research - Search across multiple academic databases
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  searchMultipleSources,
  searchArXiv,
  searchPubMed,
  searchGoogleScholar,
  searchIEEE,
  searchJSTOR,
  getPaperByDOI,
  type SearchOptions,
} from '@/lib/research-integrations'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication - any authenticated user can search
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('query') || searchParams.get('q')
    const maxResults = parseInt(searchParams.get('maxResults') || '10', 10)
    const source = searchParams.get('source')
    const doi = searchParams.get('doi')
    const sourcesParam = searchParams.get('sources')

    // DOI lookup
    if (doi) {
      const paper = await getPaperByDOI(doi)
      
      if (!paper) {
        return NextResponse.json(
          { error: 'Paper not found for the given DOI' },
          { status: 404 }
        )
      }

      monitoring.trackMetric('api_response_time', Date.now() - startTime, {
        endpoint: '/api/research',
        method: 'GET',
        type: 'doi-lookup',
      })

      return NextResponse.json({
        success: true,
        data: paper,
        type: 'doi-lookup',
      })
    }

    if (!query) {
      return NextResponse.json(
        { error: 'query or doi parameter is required' },
        { status: 400 }
      )
    }

    // Validate maxResults
    if (maxResults < 1 || maxResults > 100) {
      return NextResponse.json(
        { error: 'maxResults must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Single source search
    if (source) {
      let papers
      
      switch (source) {
        case 'arxiv':
          papers = await searchArXiv(query, maxResults)
          break
        case 'pubmed':
          papers = await searchPubMed(query, maxResults)
          break
        case 'google-scholar':
          papers = await searchGoogleScholar(query, maxResults)
          break
        case 'ieee':
          papers = await searchIEEE(query, maxResults)
          break
        case 'jstor':
          papers = await searchJSTOR(query, maxResults)
          break
        default:
          return NextResponse.json(
            { error: `Invalid source: ${source}. Valid sources: arxiv, pubmed, google-scholar, ieee, jstor` },
            { status: 400 }
          )
      }

      monitoring.trackMetric('api_response_time', Date.now() - startTime, {
        endpoint: '/api/research',
        method: 'GET',
        source,
        results: papers.length.toString(),
      })

      return NextResponse.json({
        success: true,
        data: {
          papers,
          totalResults: papers.length,
          source,
          query,
        },
      })
    }

    // Multi-source search
    const sources = sourcesParam 
      ? sourcesParam.split(',').map(s => s.trim() as 'google-scholar' | 'pubmed' | 'arxiv' | 'ieee' | 'jstor')
      : ['arxiv', 'pubmed'] as ('arxiv' | 'pubmed')[]

    const searchOptions: SearchOptions = {
      query,
      maxResults,
      sources,
    }

    const results = await searchMultipleSources(searchOptions)

    // Aggregate results
    const totalPapers = results.reduce((sum, r) => sum + r.papers.length, 0)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/research',
      method: 'GET',
      sources: sources.join(','),
      results: totalPapers.toString(),
    })

    return NextResponse.json({
      success: true,
      data: {
        results,
        totalPapers,
        query,
        sources,
      },
    })
  } catch (error) {
    console.error('Error in research API:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/research',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to search research databases',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
