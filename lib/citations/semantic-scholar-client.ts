/**
 * Semantic Scholar API Client - Phase 13
 * 
 * Semantic Scholar is a free, AI-powered research tool for scientific literature.
 * Provides citation data, paper recommendations, and semantic search.
 * 
 * API Documentation: https://api.semanticscholar.org/
 * Rate Limit: 100 requests/second with API key, 1 request/second without
 * 
 * @module lib/citations/semantic-scholar-client
 */

/**
 * Semantic Scholar Paper structure
 */
export interface SemanticScholarPaper {
  paperId: string
  externalIds?: {
    DOI?: string
    ArXiv?: string
    MAG?: string
    PubMed?: string
  }
  url?: string
  title: string
  abstract?: string
  venue?: string
  year?: number
  referenceCount?: number
  citationCount?: number
  influentialCitationCount?: number
  isOpenAccess?: boolean
  openAccessPdf?: {
    url: string
    status: string
  }
  fieldsOfStudy?: string[]
  authors?: Array<{
    authorId: string
    name: string
  }>
  citations?: Array<{
    paperId: string
    title: string
  }>
  references?: Array<{
    paperId: string
    title: string
  }>
  tldr?: {
    model: string
    text: string
  }
}

/**
 * Semantic Scholar search response
 */
export interface SemanticScholarSearchResponse {
  total: number
  offset: number
  next?: number
  data: SemanticScholarPaper[]
}

/**
 * Semantic Scholar recommendation
 */
export interface SemanticScholarRecommendation {
  recommendedPapers: SemanticScholarPaper[]
}

/**
 * Semantic Scholar API Client
 */
export class SemanticScholarClient {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SEMANTIC_SCHOLAR_API_KEY
  }

  /**
   * Get request headers
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'VibeUniversity/1.0 (mailto:dev@vibeuniversity.com)',
    }

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey
    }

    return headers
  }

  /**
   * Search for papers
   * 
   * @param query - Search query
   * @param options - Search options
   * @returns Array of papers
   * 
   * @example
   * const papers = await semanticScholarClient.searchPapers('neural networks', { limit: 10 })
   */
  async searchPapers(
    query: string,
    options: {
      limit?: number
      yearRange?: { start: number; end: number }
      fields?: string[]
    } = {}
  ): Promise<SemanticScholarPaper[]> {
    const {
      limit = 20,
      yearRange,
      fields = [
        'paperId',
        'externalIds',
        'title',
        'abstract',
        'authors',
        'venue',
        'year',
        'citationCount',
        'influentialCitationCount',
        'isOpenAccess',
        'fieldsOfStudy',
      ],
    } = options

    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString(),
        fields: fields.join(','),
      })

      if (yearRange) {
        params.append('year', `${yearRange.start}-${yearRange.end}`)
      }

      const response = await fetch(
        `${this.baseUrl}/paper/search?${params}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status}`)
      }

      const data: SemanticScholarSearchResponse = await response.json()
      return data.data || []
    } catch (error) {
      console.error('Semantic Scholar search error:', error)
      return []
    }
  }

  /**
   * Get a specific paper by ID or DOI
   * 
   * @param paperId - Paper ID, DOI, ArXiv ID, etc.
   * @param fields - Fields to include
   * @returns Paper metadata
   * 
   * @example
   * const paper = await semanticScholarClient.getPaper('DOI:10.1038/nature12373')
   * const paper2 = await semanticScholarClient.getPaper('649def34f8be52c8b66281af98ae884c09aef38b')
   */
  async getPaper(
    paperId: string,
    fields?: string[]
  ): Promise<SemanticScholarPaper | null> {
    const defaultFields = [
      'paperId',
      'externalIds',
      'url',
      'title',
      'abstract',
      'venue',
      'year',
      'referenceCount',
      'citationCount',
      'influentialCitationCount',
      'isOpenAccess',
      'openAccessPdf',
      'fieldsOfStudy',
      'authors',
      'tldr',
    ]

    const fieldList = fields || defaultFields

    try {
      const params = new URLSearchParams({
        fields: fieldList.join(','),
      })

      const response = await fetch(
        `${this.baseUrl}/paper/${encodeURIComponent(paperId)}?${params}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Semantic Scholar API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Semantic Scholar get paper error:', error)
      return null
    }
  }

  /**
   * Get papers that cite a specific paper
   * 
   * @param paperId - Paper ID
   * @param options - Options
   * @returns Array of citing papers
   */
  async getCitations(
    paperId: string,
    options: {
      limit?: number
      fields?: string[]
    } = {}
  ): Promise<SemanticScholarPaper[]> {
    const {
      limit = 100,
      fields = ['paperId', 'title', 'year', 'authors', 'citationCount'],
    } = options

    try {
      const params = new URLSearchParams({
        fields: fields.join(','),
        limit: limit.toString(),
      })

      const response = await fetch(
        `${this.baseUrl}/paper/${encodeURIComponent(paperId)}/citations?${params}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status}`)
      }

      const data: { data: Array<{ citingPaper: SemanticScholarPaper }> } =
        await response.json()
      return data.data?.map(item => item.citingPaper) || []
    } catch (error) {
      console.error('Semantic Scholar citations error:', error)
      return []
    }
  }

  /**
   * Get papers referenced by a specific paper
   * 
   * @param paperId - Paper ID
   * @param options - Options
   * @returns Array of referenced papers
   */
  async getReferences(
    paperId: string,
    options: {
      limit?: number
      fields?: string[]
    } = {}
  ): Promise<SemanticScholarPaper[]> {
    const {
      limit = 100,
      fields = ['paperId', 'title', 'year', 'authors', 'citationCount'],
    } = options

    try {
      const params = new URLSearchParams({
        fields: fields.join(','),
        limit: limit.toString(),
      })

      const response = await fetch(
        `${this.baseUrl}/paper/${encodeURIComponent(paperId)}/references?${params}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status}`)
      }

      const data: { data: Array<{ citedPaper: SemanticScholarPaper }> } =
        await response.json()
      return data.data?.map(item => item.citedPaper) || []
    } catch (error) {
      console.error('Semantic Scholar references error:', error)
      return []
    }
  }

  /**
   * Get recommended papers based on a paper
   * 
   * @param paperId - Paper ID
   * @param options - Options
   * @returns Array of recommended papers
   */
  async getRecommendations(
    paperId: string,
    options: {
      limit?: number
      fields?: string[]
    } = {}
  ): Promise<SemanticScholarPaper[]> {
    const {
      limit = 10,
      fields = ['paperId', 'title', 'abstract', 'year', 'authors', 'citationCount'],
    } = options

    try {
      const params = new URLSearchParams({
        fields: fields.join(','),
        limit: limit.toString(),
      })

      const response = await fetch(
        `${this.baseUrl}/recommendations/v1/papers/forpaper/${encodeURIComponent(paperId)}?${params}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error(`Semantic Scholar API error: ${response.status}`)
      }

      const data: SemanticScholarRecommendation = await response.json()
      return data.recommendedPapers || []
    } catch (error) {
      console.error('Semantic Scholar recommendations error:', error)
      return []
    }
  }

  /**
   * Get author information
   * 
   * @param authorId - Author ID
   * @returns Author information
   */
  async getAuthor(authorId: string) {
    try {
      const params = new URLSearchParams({
        fields: 'authorId,name,paperCount,citationCount,hIndex',
      })

      const response = await fetch(
        `${this.baseUrl}/author/${encodeURIComponent(authorId)}?${params}`,
        {
          headers: this.getHeaders(),
        }
      )

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Semantic Scholar API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Semantic Scholar get author error:', error)
      return null
    }
  }

  /**
   * Convert to simplified format
   */
  toSimplified(paper: SemanticScholarPaper) {
    return {
      id: paper.paperId,
      doi: paper.externalIds?.DOI,
      title: paper.title,
      authors: paper.authors?.map(a => a.name) || [],
      year: paper.year,
      venue: paper.venue,
      abstract: paper.abstract,
      citationCount: paper.citationCount || 0,
      influentialCitationCount: paper.influentialCitationCount || 0,
      isOpenAccess: paper.isOpenAccess || false,
      openAccessUrl: paper.openAccessPdf?.url,
      fieldsOfStudy: paper.fieldsOfStudy || [],
      tldr: paper.tldr?.text,
    }
  }
}

// Singleton instance for use across the application
export const semanticScholarClient = new SemanticScholarClient()
