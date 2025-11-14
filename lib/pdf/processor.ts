/**
 * PDF Processing Service
 * 
 * Integrates with GROBID to extract metadata, citations, and full text from PDF files.
 * 
 * @module lib/pdf/processor
 */

import { trackApiPerformance } from '@/lib/monitoring'

const GROBID_URL = process.env.GROBID_URL || 'http://localhost:8070'
const GROBID_TIMEOUT = parseInt(process.env.GROBID_TIMEOUT || '30000', 10)
const GROBID_MAX_FILE_SIZE = parseInt(process.env.GROBID_MAX_FILE_SIZE || '52428800', 10) // 50MB default

export interface PDFMetadata {
  title?: string
  authors?: Array<{
    firstName?: string
    lastName?: string
    email?: string
    affiliation?: string
  }>
  abstract?: string
  keywords?: string[]
  publicationDate?: string
  doi?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
}

export interface PDFCitation {
  id: string
  authors?: string[]
  title?: string
  journal?: string
  year?: number
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  rawText?: string
}

export interface PDFSection {
  heading?: string
  content: string
  subsections?: PDFSection[]
}

export interface PDFProcessingResult {
  success: boolean
  metadata: PDFMetadata
  citations: PDFCitation[]
  fullText?: string
  sections?: PDFSection[]
  error?: string
}

export interface PDFProcessingOptions {
  pdfPath?: string
  pdfBuffer?: Buffer
  extractCitations?: boolean
  extractFullText?: boolean
  extractSections?: boolean
  timeout?: number
}

/**
 * Check if GROBID service is available
 */
export async function isGROBIDAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${GROBID_URL}/api/isalive`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok && (await response.text()) === 'true'
  } catch (error) {
    console.error('GROBID service not available:', error)
    return false
  }
}

/**
 * Process PDF header to extract metadata
 */
async function processHeader(pdfData: Buffer): Promise<PDFMetadata> {
  const formData = new FormData()
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  formData.append('input', blob, 'document.pdf')

  const response = await fetch(`${GROBID_URL}/api/processHeaderDocument`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(GROBID_TIMEOUT),
  })

  if (!response.ok) {
    throw new Error(`GROBID header processing failed: ${response.statusText}`)
  }

  const teiXml = await response.text()
  return parseTEIMetadata(teiXml)
}

/**
 * Process PDF to extract citations/references
 */
async function processReferences(pdfData: Buffer): Promise<PDFCitation[]> {
  const formData = new FormData()
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  formData.append('input', blob, 'document.pdf')

  const response = await fetch(`${GROBID_URL}/api/processReferences`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(GROBID_TIMEOUT),
  })

  if (!response.ok) {
    throw new Error(`GROBID references processing failed: ${response.statusText}`)
  }

  const teiXml = await response.text()
  return parseTEICitations(teiXml)
}

/**
 * Process full PDF to extract all content
 */
async function processFullText(pdfData: Buffer): Promise<{
  metadata: PDFMetadata
  citations: PDFCitation[]
  fullText: string
  sections: PDFSection[]
}> {
  const formData = new FormData()
  const blob = new Blob([pdfData], { type: 'application/pdf' })
  formData.append('input', blob, 'document.pdf')

  const response = await fetch(`${GROBID_URL}/api/processFulltextDocument`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(GROBID_TIMEOUT),
  })

  if (!response.ok) {
    throw new Error(`GROBID full text processing failed: ${response.statusText}`)
  }

  const teiXml = await response.text()
  return parseTEIFullText(teiXml)
}

/**
 * Parse TEI XML to extract metadata
 */
function parseTEIMetadata(teiXml: string): PDFMetadata {
  // This is a simplified parser - in production, use a proper XML parser like 'fast-xml-parser'
  const metadata: PDFMetadata = {}

  // Extract title
  const titleMatch = teiXml.match(/<title[^>]*level="a"[^>]*>(.*?)<\/title>/s)
  if (titleMatch) {
    metadata.title = cleanXMLText(titleMatch[1])
  }

  // Extract DOI
  const doiMatch = teiXml.match(/<idno[^>]*type="DOI"[^>]*>(.*?)<\/idno>/i)
  if (doiMatch) {
    metadata.doi = cleanXMLText(doiMatch[1])
  }

  // Extract abstract
  const abstractMatch = teiXml.match(/<abstract[^>]*>(.*?)<\/abstract>/s)
  if (abstractMatch) {
    metadata.abstract = cleanXMLText(abstractMatch[1])
  }

  // Extract authors
  metadata.authors = []
  const authorMatches = teiXml.matchAll(/<author>(.*?)<\/author>/gs)
  for (const match of authorMatches) {
    const authorXML = match[1]
    const firstNameMatch = authorXML.match(/<forename[^>]*>(.*?)<\/forename>/)
    const lastNameMatch = authorXML.match(/<surname[^>]*>(.*?)<\/surname>/)
    const emailMatch = authorXML.match(/<email[^>]*>(.*?)<\/email>/)

    metadata.authors.push({
      firstName: firstNameMatch ? cleanXMLText(firstNameMatch[1]) : undefined,
      lastName: lastNameMatch ? cleanXMLText(lastNameMatch[1]) : undefined,
      email: emailMatch ? cleanXMLText(emailMatch[1]) : undefined,
    })
  }

  // Extract publication info
  const dateMatch = teiXml.match(/<date[^>]*when="([^"]*)"/)
  if (dateMatch) {
    metadata.publicationDate = dateMatch[1]
  }

  const journalMatch = teiXml.match(/<title[^>]*level="j"[^>]*>(.*?)<\/title>/)
  if (journalMatch) {
    metadata.journal = cleanXMLText(journalMatch[1])
  }

  return metadata
}

/**
 * Parse TEI XML to extract citations
 */
function parseTEICitations(teiXml: string): PDFCitation[] {
  const citations: PDFCitation[] = []

  // Extract bibliographic references
  const biblMatches = teiXml.matchAll(/<biblStruct[^>]*xml:id="([^"]*)"[^>]*>(.*?)<\/biblStruct>/gs)

  for (const match of biblMatches) {
    const id = match[1]
    const biblXML = match[2]

    const citation: PDFCitation = { id }

    // Extract title
    const titleMatch = biblXML.match(/<title[^>]*>(.*?)<\/title>/)
    if (titleMatch) {
      citation.title = cleanXMLText(titleMatch[1])
    }

    // Extract authors
    citation.authors = []
    const authorMatches = biblXML.matchAll(/<author>(.*?)<\/author>/gs)
    for (const authorMatch of authorMatches) {
      const authorXML = authorMatch[1]
      const surnameMatch = authorXML.match(/<surname[^>]*>(.*?)<\/surname>/)
      if (surnameMatch) {
        citation.authors.push(cleanXMLText(surnameMatch[1]))
      }
    }

    // Extract year
    const yearMatch = biblXML.match(/<date[^>]*when="(\d{4})"/)
    if (yearMatch) {
      citation.year = parseInt(yearMatch[1], 10)
    }

    // Extract journal
    const journalMatch = biblXML.match(/<title[^>]*level="j"[^>]*>(.*?)<\/title>/)
    if (journalMatch) {
      citation.journal = cleanXMLText(journalMatch[1])
    }

    // Extract DOI
    const doiMatch = biblXML.match(/<idno[^>]*type="DOI"[^>]*>(.*?)<\/idno>/i)
    if (doiMatch) {
      citation.doi = cleanXMLText(doiMatch[1])
    }

    citations.push(citation)
  }

  return citations
}

/**
 * Parse TEI XML to extract full text and sections
 */
function parseTEIFullText(teiXml: string): {
  metadata: PDFMetadata
  citations: PDFCitation[]
  fullText: string
  sections: PDFSection[]
} {
  const metadata = parseTEIMetadata(teiXml)
  const citations = parseTEICitations(teiXml)

  // Extract body text
  const bodyMatch = teiXml.match(/<body>(.*?)<\/body>/s)
  const fullText = bodyMatch ? cleanXMLText(bodyMatch[1]) : ''

  // Extract sections
  const sections: PDFSection[] = []
  if (bodyMatch) {
    const divMatches = bodyMatch[1].matchAll(/<div[^>]*>(.*?)<\/div>/gs)
    for (const divMatch of divMatches) {
      const divXML = divMatch[1]
      const headMatch = divXML.match(/<head[^>]*>(.*?)<\/head>/)
      const heading = headMatch ? cleanXMLText(headMatch[1]) : undefined

      const content = cleanXMLText(divXML)
      sections.push({ heading, content })
    }
  }

  return { metadata, citations, fullText, sections }
}

/**
 * Clean XML text by removing tags and decoding entities
 * 
 * SECURITY NOTE: This function processes trusted TEI XML output from GROBID service.
 * The output is stored as plain text in the database and is NOT rendered as HTML.
 * 
 * The order of replacements is intentional:
 * 1. Remove ALL XML tags first (including <script> tags)
 * 2. Decode &amp; first to avoid double-decoding issues
 * 3. Decode other entities
 * 
 * This is NOT suitable for sanitizing untrusted user input for HTML rendering.
 * For that use case, use a proper HTML sanitizer like DOMPurify.
 */
function cleanXMLText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove XML tags (including <script>)
    .replace(/&amp;/g, '&')   // Decode & first to avoid double-decoding
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Main function to process PDF
 */
export async function processPDF(
  options: PDFProcessingOptions
): Promise<PDFProcessingResult> {
  return trackApiPerformance('grobid.process', async () => {
    try {
      // Check if GROBID is available
      const available = await isGROBIDAvailable()
      if (!available) {
        return {
          success: false,
          metadata: {},
          citations: [],
          error: 'GROBID service is not available. Please ensure it is running.',
        }
      }

      // Get PDF data
      let pdfData: Buffer
      if (options.pdfBuffer) {
        pdfData = options.pdfBuffer
      } else if (options.pdfPath) {
        const fs = await import('fs/promises')
        pdfData = await fs.readFile(options.pdfPath)
      } else {
        throw new Error('Either pdfPath or pdfBuffer must be provided')
      }

      // Check file size
      if (pdfData.length > GROBID_MAX_FILE_SIZE) {
        return {
          success: false,
          metadata: {},
          citations: [],
          error: `PDF file is too large (${Math.round(pdfData.length / 1024 / 1024)}MB). Maximum size is ${Math.round(GROBID_MAX_FILE_SIZE / 1024 / 1024)}MB.`,
        }
      }

      // Process based on options
      if (options.extractFullText || options.extractSections) {
        const result = await processFullText(pdfData)
        return {
          success: true,
          metadata: result.metadata,
          citations: result.citations,
          fullText: options.extractFullText ? result.fullText : undefined,
          sections: options.extractSections ? result.sections : undefined,
        }
      } else if (options.extractCitations) {
        const metadata = await processHeader(pdfData)
        const citations = await processReferences(pdfData)
        return {
          success: true,
          metadata,
          citations,
        }
      } else {
        // Header only
        const metadata = await processHeader(pdfData)
        return {
          success: true,
          metadata,
          citations: [],
        }
      }
    } catch (error) {
      console.error('Error processing PDF:', error)
      return {
        success: false,
        metadata: {},
        citations: [],
        error: error instanceof Error ? error.message : 'Unknown error processing PDF',
      }
    }
  })
}

/**
 * Batch process multiple PDFs
 */
export async function processPDFBatch(
  pdfs: Array<{ path: string; id: string }>,
  options: Omit<PDFProcessingOptions, 'pdfPath' | 'pdfBuffer'> = {}
): Promise<Array<PDFProcessingResult & { id: string }>> {
  const results = await Promise.all(
    pdfs.map(async ({ path, id }) => {
      const result = await processPDF({ ...options, pdfPath: path })
      return { ...result, id }
    })
  )

  return results
}
