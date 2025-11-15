/**
 * OpenAlex API Client - Phase 13
 * 
 * OpenAlex is a fully open catalog of the global research system.
 * Provides comprehensive metadata for academic works, authors, venues, etc.
 * 
 * API Documentation: https://docs.openalex.org/
 * Rate Limit: 100,000 requests/day (no API key required)
 * 
 * @module lib/citations/openalex-client
 */

/**
 * OpenAlex Work structure
 */
export interface OpenAlexWork {
  id: string
  doi?: string
  title: string
  authorships: Array<{
    author: {
      id: string
      display_name: string
      orcid?: string
    }
    institutions: Array<{
      id: string
      display_name: string
    }>
  }>
  publication_year?: number
  publication_date?: string
  primary_location?: {
    source?: {
      id: string
      display_name: string
      type: string
    }
  }
  biblio?: {
    volume?: string
    issue?: string
    first_page?: string
    last_page?: string
  }
  type: string
  cited_by_count: number
  is_retracted: boolean
  is_paratext: boolean
  concepts?: Array<{
    id: string
    display_name: string
    score: number
  }>
  abstract_inverted_index?: Record<string, number[]>
  open_access?: {
    is_oa: boolean
    oa_status: string
    oa_url?: string
  }
  referenced_works?: string[]
  related_works?: string[]
}

/**
 * OpenAlex search response
 */
export interface OpenAlexSearchResponse {
  results: OpenAlexWork[]
  meta: {
    count: number
    db_response_time_ms: number
    page: number
    per_page: number
  }
}

/**
 * OpenAlex API Client
 */
export class OpenAlexClient {
  private baseUrl = 'https://api.openalex.org'
  private email: string

  constructor(email?: string) {
    this.email = email || process.env.OPENALEX_EMAIL || 'dev@vibeuniversity.com'
  }

  /**
   * Search for works by query
   * 
   * @param query - Search query
   * @param options - Search options
   * @returns Array of works
   * 
   * @example
   * const works = await openAlexClient.searchWorks('machine learning', { limit: 10 })
   */
  async searchWorks(
    query: string,
    options: {
      limit?: number
      yearRange?: { start: number; end: number }
      openAccessOnly?: boolean
    } = {}
  ): Promise<OpenAlexWork[]> {
    const { limit = 20, yearRange, openAccessOnly } = options

    try {
      const params = new URLSearchParams({
        search: query,
        per_page: limit.toString(),
        mailto: this.email,
      })

      // Add filters
      const filters: string[] = []
      
      if (yearRange) {
        filters.push(`publication_year:${yearRange.start}-${yearRange.end}`)
      }
      
      if (openAccessOnly) {
        filters.push('is_oa:true')
      }

      if (filters.length > 0) {
        params.append('filter', filters.join(','))
      }

      const response = await fetch(`${this.baseUrl}/works?${params}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`,
        },
      })

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`)
      }

      const data: OpenAlexSearchResponse = await response.json()
      return data.results || []
    } catch (error) {
      console.error('OpenAlex search error:', error)
      return []
    }
  }

  /**
   * Get a specific work by ID or DOI
   * 
   * @param id - OpenAlex ID or DOI
   * @returns Work metadata
   * 
   * @example
   * const work = await openAlexClient.getWork('W2741809807')
   * const work2 = await openAlexClient.getWork('https://doi.org/10.1038/nature12373')
   */
  async getWork(id: string): Promise<OpenAlexWork | null> {
    try {
      // Handle DOI format
      let workId = id
      if (id.startsWith('10.') || id.includes('doi.org')) {
        workId = id.replace(/^https?:\/\/(dx\.)?doi\.org\//, 'https://doi.org/')
      } else if (!id.startsWith('W')) {
        workId = `W${id}`
      }

      const response = await fetch(
        `${this.baseUrl}/works/${encodeURIComponent(workId)}?mailto=${this.email}`,
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
        throw new Error(`OpenAlex API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('OpenAlex get work error:', error)
      return null
    }
  }

  /**
   * Get works that cite a specific work
   * 
   * @param workId - OpenAlex work ID
   * @param limit - Maximum number of results
   * @returns Array of citing works
   */
  async getCitingWorks(workId: string, limit = 50): Promise<OpenAlexWork[]> {
    try {
      const params = new URLSearchParams({
        filter: `cites:${workId}`,
        per_page: limit.toString(),
        mailto: this.email,
      })

      const response = await fetch(`${this.baseUrl}/works?${params}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`,
        },
      })

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`)
      }

      const data: OpenAlexSearchResponse = await response.json()
      return data.results || []
    } catch (error) {
      console.error('OpenAlex citing works error:', error)
      return []
    }
  }

  /**
   * Get works related to a specific work
   * 
   * @param workId - OpenAlex work ID
   * @param limit - Maximum number of results
   * @returns Array of related works
   */
  async getRelatedWorks(workId: string, limit = 20): Promise<OpenAlexWork[]> {
    try {
      const params = new URLSearchParams({
        filter: `related_to:${workId}`,
        per_page: limit.toString(),
        mailto: this.email,
      })

      const response = await fetch(`${this.baseUrl}/works?${params}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`,
        },
      })

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`)
      }

      const data: OpenAlexSearchResponse = await response.json()
      return data.results || []
    } catch (error) {
      console.error('OpenAlex related works error:', error)
      return []
    }
  }

  /**
   * Search by author name
   * 
   * @param authorName - Author name
   * @param limit - Maximum number of results
   * @returns Array of works by author
   */
  async searchByAuthor(authorName: string, limit = 20): Promise<OpenAlexWork[]> {
    try {
      const params = new URLSearchParams({
        filter: `authorships.author.display_name.search:${authorName}`,
        per_page: limit.toString(),
        mailto: this.email,
      })

      const response = await fetch(`${this.baseUrl}/works?${params}`, {
        headers: {
          'User-Agent': `VibeUniversity/1.0 (mailto:${this.email})`,
        },
      })

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status}`)
      }

      const data: OpenAlexSearchResponse = await response.json()
      return data.results || []
    } catch (error) {
      console.error('OpenAlex author search error:', error)
      return []
    }
  }

  /**
   * Reconstruct abstract from inverted index
   * 
   * @param invertedIndex - Inverted index from OpenAlex
   * @returns Reconstructed abstract text
   */
  reconstructAbstract(invertedIndex?: Record<string, number[]>): string {
    if (!invertedIndex) return ''

    const words: string[] = []
    
    // Flatten the inverted index to get word positions
    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const position of positions) {
        words[position] = word
      }
    }

    return words.filter(Boolean).join(' ')
  }

  /**
   * Convert OpenAlex work to simplified format
   */
  toSimplified(work: OpenAlexWork) {
    return {
      id: work.id,
      doi: work.doi,
      title: work.title,
      authors: work.authorships.map(a => ({
        name: a.author.display_name,
        orcid: a.author.orcid,
      })),
      year: work.publication_year,
      journal: work.primary_location?.source?.display_name,
      volume: work.biblio?.volume,
      issue: work.biblio?.issue,
      pages: work.biblio?.first_page && work.biblio?.last_page
        ? `${work.biblio.first_page}-${work.biblio.last_page}`
        : work.biblio?.first_page,
      citationCount: work.cited_by_count,
      isOpenAccess: work.open_access?.is_oa || false,
      openAccessUrl: work.open_access?.oa_url,
      abstract: this.reconstructAbstract(work.abstract_inverted_index),
      concepts: work.concepts?.map(c => c.display_name) || [],
    }
  }
}

// Singleton instance for use across the application
export const openAlexClient = new OpenAlexClient()
