/**
 * Crossref API Client - Phase 13
 * 
 * Crossref provides comprehensive citation metadata for academic works
 * via DOI resolution and search capabilities.
 * 
 * API Documentation: https://www.crossref.org/documentation/
 * Rate Limit: 50 requests/second with polite pool
 * 
 * @module lib/citations/crossref-client
 */

/**
 * Crossref Work metadata structure
 */
export interface CrossrefWork {
  DOI: string
  title: string[]
  author?: Array<{
    given?: string
    family: string
    ORCID?: string
    affiliation?: Array<{ name: string }>
  }>
  'published-print'?: { 'date-parts': number[][] }
  'published-online'?: { 'date-parts': number[][] }
  'container-title'?: string[]
  volume?: string
  issue?: string
  page?: string
  publisher?: string
  type: string
  abstract?: string
  'is-referenced-by-count'?: number
  subject?: string[]
  URL?: string
}

/**
 * CSL-JSON format for citation processing
 */
export interface CSLItem {
  type: string
  DOI?: string
  title?: string
  author?: Array<{
    given?: string
    family: string
  }>
  issued?: {
    'date-parts': number[][]
  }
  'container-title'?: string
  volume?: string
  issue?: string
  page?: string
  publisher?: string
  URL?: string
}

/**
 * Crossref API Client
 * 
 * Implements polite pool with email identification and caching
 */
export class CrossrefClient {
  private baseUrl = 'https://api.crossref.org/works'
  private email: string
  private cache: Map<string, CrossrefWork>

  constructor(email?: string) {
    this.email = email || process.env.CROSSREF_EMAIL || 'dev@vibeuniversity.com'
    this.cache = new Map()
  }

  /**
   * Resolve DOI to citation metadata
   * 
   * @param doi - Digital Object Identifier (e.g., "10.1000/xyz")
   * @returns Work metadata or null if not found
   * 
   * @example
   * const work = await crossrefClient.resolveDOI('10.1038/nature12373')
   * console.log(work.title[0])
   */
  async resolveDOI(doi: string): Promise<CrossrefWork | null> {
    // Normalize DOI (remove URL prefix if present)
    const normalizedDOI = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '')

    // Check cache first
    if (this.cache.has(normalizedDOI)) {
      return this.cache.get(normalizedDOI)!
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/${encodeURIComponent(normalizedDOI)}`,
        {
          headers: {
            'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`,
          },
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Crossref API error: ${response.status}`)
      }

      const data = await response.json()
      const work = data.message as CrossrefWork

      // Cache result
      this.cache.set(normalizedDOI, work)

      return work
    } catch (error) {
      console.error('Crossref DOI resolution error:', error)
      return null
    }
  }

  /**
   * Search for works by query string
   * 
   * @param query - Search query (title, author, keywords)
   * @param limit - Maximum number of results (default: 20)
   * @returns Array of work metadata
   * 
   * @example
   * const works = await crossrefClient.search('machine learning', 10)
   */
  async search(query: string, limit = 20): Promise<CrossrefWork[]> {
    try {
      const params = new URLSearchParams({
        query,
        rows: limit.toString(),
        mailto: this.email,
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`,
        },
      })

      if (!response.ok) {
        throw new Error(`Crossref search error: ${response.status}`)
      }

      const data = await response.json()
      return (data.message.items as CrossrefWork[]) || []
    } catch (error) {
      console.error('Crossref search error:', error)
      return []
    }
  }

  /**
   * Search by author name
   * 
   * @param author - Author name (e.g., "Jane Smith")
   * @param limit - Maximum number of results
   */
  async searchByAuthor(author: string, limit = 20): Promise<CrossrefWork[]> {
    try {
      const params = new URLSearchParams({
        'query.author': author,
        rows: limit.toString(),
        mailto: this.email,
      })

      const response = await fetch(`${this.baseUrl}?${params}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`,
        },
      })

      if (!response.ok) {
        throw new Error(`Crossref author search error: ${response.status}`)
      }

      const data = await response.json()
      return (data.message.items as CrossrefWork[]) || []
    } catch (error) {
      console.error('Crossref author search error:', error)
      return []
    }
  }

  /**
   * Convert Crossref work to CSL-JSON format
   * 
   * CSL-JSON is the standard format for citation processing
   * 
   * @param work - Crossref work metadata
   * @returns CSL-JSON formatted citation
   */
  toCSL(work: CrossrefWork): CSLItem {
    return {
      type: this.mapCrossrefTypeToCSL(work.type),
      DOI: work.DOI,
      title: work.title?.[0],
      author: work.author?.map((a) => ({
        given: a.given,
        family: a.family,
      })),
      issued: work['published-print']?.['date-parts']
        ? { 'date-parts': work['published-print']['date-parts'] }
        : work['published-online']?.['date-parts']
        ? { 'date-parts': work['published-online']['date-parts'] }
        : undefined,
      'container-title': work['container-title']?.[0],
      volume: work.volume,
      issue: work.issue,
      page: work.page,
      publisher: work.publisher,
      URL: work.URL || `https://doi.org/${work.DOI}`,
    }
  }

  /**
   * Map Crossref type to CSL type
   */
  private mapCrossrefTypeToCSL(type: string): string {
    const typeMap: Record<string, string> = {
      'journal-article': 'article-journal',
      'book-chapter': 'chapter',
      'posted-content': 'article',
      'proceedings-article': 'paper-conference',
      'monograph': 'book',
      'report': 'report',
      'peer-review': 'review',
      'book-track': 'chapter',
      'journal-issue': 'article-journal',
      'journal-volume': 'article-journal',
      'book-part': 'chapter',
      'other': 'article',
      'dissertation': 'thesis',
      'standard': 'article',
      'reference-entry': 'entry',
      'dataset': 'dataset',
    }

    return typeMap[type] || 'article'
  }

  /**
   * Clear the internal cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    }
  }
}

// Singleton instance for use across the application
export const crossrefClient = new CrossrefClient()
