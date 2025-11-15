/**
 * GROBID PDF Processing Client - Phase 13
 * 
 * GROBID (GeneRation Of BIbliographic Data) is a machine learning library
 * for extracting, parsing, and re-structuring raw documents such as PDF
 * into structured TEI-encoded documents.
 * 
 * Documentation: https://grobid.readthedocs.io/
 * 
 * @module lib/pdf/grobid-client
 */

/**
 * GROBID extracted metadata structure
 */
export interface GrobidMetadata {
  title: string
  authors: Array<{
    firstName: string
    middleName?: string
    lastName: string
    affiliation?: string
    email?: string
  }>
  abstract: string
  citations: Array<{
    title: string
    authors: string[]
    year?: number
    doi?: string
    journal?: string
    volume?: string
    pages?: string
    raw: string
  }>
  date?: string
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  doi?: string
  keywords?: string[]
  references?: Array<{
    title: string
    authors: string[]
    year?: number
  }>
}

/**
 * GROBID processing status
 */
export interface GrobidStatus {
  status: 'ok' | 'error'
  version?: string
  message?: string
}

/**
 * GROBID API Client
 * 
 * Processes PDFs to extract structured metadata and citations
 */
export class GrobidClient {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.GROBID_URL || 'http://localhost:8070/api'
  }

  /**
   * Check if GROBID service is alive
   * 
   * @returns Service status
   */
  async isAlive(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/isalive`, {
        method: 'GET',
      })
      return response.ok
    } catch (error) {
      console.error('GROBID health check failed:', error)
      return false
    }
  }

  /**
   * Get GROBID version information
   */
  async getVersion(): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/version`, {
        method: 'GET',
      })
      if (response.ok) {
        const text = await response.text()
        return text.trim()
      }
      return null
    } catch (error) {
      console.error('Failed to get GROBID version:', error)
      return null
    }
  }

  /**
   * Process PDF and extract complete metadata including citations
   * 
   * @param pdfBuffer - PDF file as Buffer
   * @returns Extracted metadata or null on error
   * 
   * @example
   * const pdfBuffer = await fs.readFile('paper.pdf')
   * const metadata = await grobidClient.processFulltext(pdfBuffer)
   * console.log(metadata.title)
   * console.log(`Found ${metadata.citations.length} citations`)
   */
  async processFulltext(pdfBuffer: Buffer): Promise<GrobidMetadata | null> {
    const formData = new FormData()
    formData.append('input', new Blob([pdfBuffer]), 'document.pdf')

    try {
      const response = await fetch(`${this.baseUrl}/processFulltextDocument`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`GROBID processing error: ${response.status}`)
      }

      const teiXml = await response.text()
      return this.parseTEI(teiXml)
    } catch (error) {
      console.error('GROBID fulltext processing error:', error)
      return null
    }
  }

  /**
   * Process PDF header only (faster than full text)
   * 
   * @param pdfBuffer - PDF file as Buffer
   * @returns Basic metadata without citations
   */
  async processHeader(pdfBuffer: Buffer): Promise<Partial<GrobidMetadata> | null> {
    const formData = new FormData()
    formData.append('input', new Blob([pdfBuffer]), 'document.pdf')

    try {
      const response = await fetch(`${this.baseUrl}/processHeaderDocument`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`GROBID header processing error: ${response.status}`)
      }

      const teiXml = await response.text()
      return this.parseHeaderTEI(teiXml)
    } catch (error) {
      console.error('GROBID header processing error:', error)
      return null
    }
  }

  /**
   * Extract citations only from PDF
   * 
   * @param pdfBuffer - PDF file as Buffer
   * @returns Array of citations
   */
  async processCitations(pdfBuffer: Buffer): Promise<GrobidMetadata['citations']> {
    const formData = new FormData()
    formData.append('input', new Blob([pdfBuffer]), 'document.pdf')

    try {
      const response = await fetch(`${this.baseUrl}/processCitations`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`GROBID citations processing error: ${response.status}`)
      }

      const teiXml = await response.text()
      return this.parseCitationsTEI(teiXml)
    } catch (error) {
      console.error('GROBID citations processing error:', error)
      return []
    }
  }

  /**
   * Parse TEI XML to structured metadata
   * 
   * TEI (Text Encoding Initiative) is an XML format for representing texts
   * 
   * @param teiXml - TEI XML string from GROBID
   * @returns Structured metadata
   */
  private parseTEI(teiXml: string): GrobidMetadata {
    // Basic parsing - in production, use proper XML parser like xml2js or fast-xml-parser
    // This is a simplified implementation
    
    const metadata: GrobidMetadata = {
      title: '',
      authors: [],
      abstract: '',
      citations: [],
    }

    try {
      // Extract title
      const titleMatch = teiXml.match(/<title[^>]*level="a"[^>]*>([^<]+)<\/title>/)
      if (titleMatch) {
        metadata.title = this.cleanText(titleMatch[1])
      }

      // Extract authors
      const authorMatches = teiXml.matchAll(/<author>([\s\S]*?)<\/author>/g)
      for (const match of authorMatches) {
        const authorXml = match[1]
        const firstName = authorXml.match(/<forename[^>]*type="first"[^>]*>([^<]+)<\/forename>/)
        const lastName = authorXml.match(/<surname>([^<]+)<\/surname>/)
        
        if (firstName && lastName) {
          metadata.authors.push({
            firstName: this.cleanText(firstName[1]),
            lastName: this.cleanText(lastName[1]),
          })
        }
      }

      // Extract abstract
      const abstractMatch = teiXml.match(/<abstract>([\s\S]*?)<\/abstract>/)
      if (abstractMatch) {
        const abstractText = abstractMatch[1].replace(/<[^>]+>/g, ' ')
        metadata.abstract = this.cleanText(abstractText)
      }

      // Extract DOI
      const doiMatch = teiXml.match(/<idno[^>]*type="DOI"[^>]*>([^<]+)<\/idno>/)
      if (doiMatch) {
        metadata.doi = this.cleanText(doiMatch[1])
      }

      // Extract date
      const dateMatch = teiXml.match(/<date[^>]*when="([^"]+)"/)
      if (dateMatch) {
        metadata.date = dateMatch[1]
      }

      // Extract citations from bibliography
      const biblMatches = teiXml.matchAll(/<biblStruct[^>]*>([\s\S]*?)<\/biblStruct>/g)
      for (const match of biblMatches) {
        const biblXml = match[1]
        
        const citation: GrobidMetadata['citations'][0] = {
          title: '',
          authors: [],
          raw: this.cleanText(biblXml.replace(/<[^>]+>/g, ' ')),
        }

        // Extract citation title
        const citTitleMatch = biblXml.match(/<title[^>]*>([^<]+)<\/title>/)
        if (citTitleMatch) {
          citation.title = this.cleanText(citTitleMatch[1])
        }

        // Extract citation authors
        const citAuthorMatches = biblXml.matchAll(/<author>([\s\S]*?)<\/author>/g)
        for (const authorMatch of citAuthorMatches) {
          const authorXml = authorMatch[1]
          const firstName = authorXml.match(/<forename[^>]*>([^<]+)<\/forename>/)
          const lastName = authorXml.match(/<surname>([^<]+)<\/surname>/)
          
          if (lastName) {
            const fullName = firstName 
              ? `${this.cleanText(firstName[1])} ${this.cleanText(lastName[1])}`
              : this.cleanText(lastName[1])
            citation.authors.push(fullName)
          }
        }

        // Extract citation year
        const yearMatch = biblXml.match(/<date[^>]*when="(\d{4})"/)
        if (yearMatch) {
          citation.year = parseInt(yearMatch[1], 10)
        }

        // Extract citation DOI
        const citDoiMatch = biblXml.match(/<idno[^>]*type="DOI"[^>]*>([^<]+)<\/idno>/)
        if (citDoiMatch) {
          citation.doi = this.cleanText(citDoiMatch[1])
        }

        metadata.citations.push(citation)
      }

    } catch (error) {
      console.error('TEI parsing error:', error)
    }

    return metadata
  }

  /**
   * Parse header-only TEI XML
   */
  private parseHeaderTEI(teiXml: string): Partial<GrobidMetadata> {
    const fullMetadata = this.parseTEI(teiXml)
    
    return {
      title: fullMetadata.title,
      authors: fullMetadata.authors,
      abstract: fullMetadata.abstract,
      date: fullMetadata.date,
      doi: fullMetadata.doi,
    }
  }

  /**
   * Parse citations-only TEI XML
   */
  private parseCitationsTEI(teiXml: string): GrobidMetadata['citations'] {
    const fullMetadata = this.parseTEI(teiXml)
    return fullMetadata.citations
  }

  /**
   * Clean extracted text (remove extra whitespace, decode entities)
   */
  private cleanText(text: string): string {
    // Decode HTML entities in correct order to avoid double-escaping
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, '&')  // Decode &amp; last to avoid double-decoding
      .replace(/\s+/g, ' ')
      .trim()
  }
}

// Singleton instance for use across the application
export const grobidClient = new GrobidClient()
