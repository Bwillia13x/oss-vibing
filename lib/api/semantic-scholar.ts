/**
 * Semantic Scholar API Client
 * 
 * Provides access to the Semantic Scholar Academic Graph API for citation networks
 * and paper relationships.
 * 
 * API Documentation: https://api.semanticscholar.org/api-docs/
 * Rate Limiting: 100 requests/5 minutes without API key, 1000/5min with API key
 * 
 * @module lib/api/semantic-scholar
 */

import { trackApiPerformance } from '@/lib/monitoring'
import { getOrSetCached, generateCacheKey, DEFAULT_TTL } from '@/lib/cache'

const SEMANTIC_SCHOLAR_API_BASE = 'https://api.semanticscholar.org/graph/v1'
const API_KEY = process.env.SEMANTIC_SCHOLAR_API_KEY // Optional for higher rate limits

// Cache TTLs
const CACHE_TTL = {
  PAPER_LOOKUP: DEFAULT_TTL.DAY, // Paper metadata rarely changes
  CITATIONS: DEFAULT_TTL.DAY, // Citation data rarely changes
  REFERENCES: DEFAULT_TTL.DAY, // Reference data rarely changes
  SEARCH: DEFAULT_TTL.LONG, // Search results can change more frequently
  AUTHOR: DEFAULT_TTL.DAY, // Author data rarely changes
}

// Warn developers if API key is missing in development mode
if (!API_KEY && process.env.NODE_ENV === 'development') {
  console.warn('SEMANTIC_SCHOLAR_API_KEY not set. Using lower rate limits (100 req/5min).')
}

export interface SemanticScholarPaper {
  paperId: string
  corpusId?: number
  title?: string
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
  s2FieldsOfStudy?: Array<{
    category: string
    source: string
  }>
  publicationTypes?: string[]
  publicationDate?: string
  journal?: {
    name?: string
    volume?: string
    pages?: string
  }
  authors?: Array<{
    authorId: string
    name: string
    url?: string
    affiliations?: string[]
    homepage?: string
    paperCount?: number
    citationCount?: number
    hIndex?: number
  }>
  externalIds?: {
    MAG?: string
    DBLP?: string
    PubMed?: string
    DOI?: string
    CorpusId?: number
  }
  url?: string
  citations?: SemanticScholarPaper[]
  references?: SemanticScholarPaper[]
  embedding?: {
    model: string
    vector: number[]
  }
}

export interface SemanticScholarAuthor {
  authorId: string
  name: string
  url?: string
  aliases?: string[]
  affiliations?: string[]
  homepage?: string
  paperCount?: number
  citationCount?: number
  hIndex?: number
  papers?: SemanticScholarPaper[]
}

export interface SemanticScholarSearchResult {
  total: number
  offset: number
  next?: number
  data: SemanticScholarPaper[]
}

/**
 * Build headers for API requests
 */
function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (API_KEY) {
    headers['x-api-key'] = API_KEY
  }
  
  return headers
}

/**
 * Search for papers by query
 */
export async function searchPapers(
  query: string,
  options: {
    offset?: number
    limit?: number
    fields?: string[]
    year?: string // e.g., "2019-2021" or "2020"
    fieldsOfStudy?: string[]
  } = {}
): Promise<SemanticScholarSearchResult | null> {
  const cacheKey = generateCacheKey('semanticscholar', 'search', query, JSON.stringify(options))
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('semanticscholar.search', async () => {
      const params = new URLSearchParams({
        query,
        offset: String(options.offset || 0),
        limit: String(options.limit || 10),
      })

      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','))
      } else {
        // Default fields
        params.append('fields', 'title,authors,year,abstract,citationCount,influentialCitationCount')
      }

      if (options.year) {
        params.append('year', options.year)
      }

      if (options.fieldsOfStudy && options.fieldsOfStudy.length > 0) {
        params.append('fieldsOfStudy', options.fieldsOfStudy.join(','))
      }

      try {
        const response = await fetch(`${SEMANTIC_SCHOLAR_API_BASE}/paper/search?${params.toString()}`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error searching Semantic Scholar:', {
          query,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        })
        return null
      }
    }),
    CACHE_TTL.SEARCH
  )
}

/**
 * Get a paper by ID (Semantic Scholar ID, DOI, ArXiv ID, MAG ID, etc.)
 */
export async function getPaper(
  paperId: string,
  options: {
    fields?: string[]
  } = {}
): Promise<SemanticScholarPaper | null> {
  const cacheKey = generateCacheKey('semanticscholar', 'paper', paperId, JSON.stringify(options))
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('semanticscholar.getPaper', async () => {
      const params = new URLSearchParams()

      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','))
      } else {
        // Default comprehensive fields
        params.append('fields', 
          'paperId,title,abstract,venue,year,referenceCount,citationCount,influentialCitationCount,' +
          'isOpenAccess,openAccessPdf,fieldsOfStudy,s2FieldsOfStudy,publicationTypes,' +
          'publicationDate,journal,authors,externalIds,url'
        )
      }

      try {
        const response = await fetch(`${SEMANTIC_SCHOLAR_API_BASE}/paper/${paperId}?${params.toString()}`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error getting paper:', error)
        return null
      }
    }),
    CACHE_TTL.PAPER_LOOKUP
  )
}

/**
 * Get a paper by DOI
 */
export async function getPaperByDOI(doi: string, options?: { fields?: string[] }): Promise<SemanticScholarPaper | null> {
  const cleanDOI = doi.trim().replace(/^https?:\/\/doi\.org\//, '')
  return getPaper(`DOI:${cleanDOI}`, options)
}

/**
 * Get citations for a paper
 */
export async function getCitations(
  paperId: string,
  options: {
    offset?: number
    limit?: number
    fields?: string[]
  } = {}
): Promise<{ offset: number; next?: number; data: SemanticScholarPaper[] } | null> {
  const cacheKey = generateCacheKey('semanticscholar', 'citations', paperId, JSON.stringify(options))
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('semanticscholar.getCitations', async () => {
      const params = new URLSearchParams({
        offset: String(options.offset || 0),
        limit: String(options.limit || 100),
      })

      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','))
      }

      try {
        const response = await fetch(`${SEMANTIC_SCHOLAR_API_BASE}/paper/${paperId}/citations?${params.toString()}`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error getting citations:', error)
        return null
      }
    }),
    CACHE_TTL.CITATIONS
  )
}

/**
 * Get references for a paper
 */
export async function getReferences(
  paperId: string,
  options: {
    offset?: number
    limit?: number
    fields?: string[]
  } = {}
): Promise<{ offset: number; next?: number; data: SemanticScholarPaper[] } | null> {
  const cacheKey = generateCacheKey('semanticscholar', 'references', paperId, JSON.stringify(options))
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('semanticscholar.getReferences', async () => {
      const params = new URLSearchParams({
        offset: String(options.offset || 0),
        limit: String(options.limit || 100),
      })

      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','))
      }

      try {
        const response = await fetch(`${SEMANTIC_SCHOLAR_API_BASE}/paper/${paperId}/references?${params.toString()}`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error getting references:', error)
        return null
      }
    }),
    CACHE_TTL.REFERENCES
  )
}

/**
 * Get an author by ID
 */
export async function getAuthor(
  authorId: string,
  options: {
    fields?: string[]
  } = {}
): Promise<SemanticScholarAuthor | null> {
  const cacheKey = generateCacheKey('semanticscholar', 'author', authorId, JSON.stringify(options))
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('semanticscholar.getAuthor', async () => {
      const params = new URLSearchParams()

      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','))
      }

      try {
        const response = await fetch(`${SEMANTIC_SCHOLAR_API_BASE}/author/${authorId}?${params.toString()}`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error getting author:', error)
        return null
      }
    }),
    CACHE_TTL.AUTHOR
  )
}

/**
 * Search for authors
 */
export async function searchAuthors(
  query: string,
  options: {
    offset?: number
    limit?: number
    fields?: string[]
  } = {}
): Promise<{ offset: number; next?: number; data: SemanticScholarAuthor[] } | null> {
  const cacheKey = generateCacheKey('semanticscholar', 'searchAuthors', query, JSON.stringify(options))
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('semanticscholar.searchAuthors', async () => {
      const params = new URLSearchParams({
        query,
        offset: String(options.offset || 0),
        limit: String(options.limit || 10),
      })

      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','))
      }

      try {
        const response = await fetch(`${SEMANTIC_SCHOLAR_API_BASE}/author/search?${params.toString()}`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error searching authors:', error)
        return null
      }
    }),
    CACHE_TTL.SEARCH
  )
}

/**
 * Get papers by an author
 */
export async function getAuthorPapers(
  authorId: string,
  options: {
    offset?: number
    limit?: number
    fields?: string[]
  } = {}
): Promise<{ offset: number; next?: number; data: SemanticScholarPaper[] } | null> {
  const cacheKey = generateCacheKey('semanticscholar', 'authorPapers', authorId, JSON.stringify(options))
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('semanticscholar.getAuthorPapers', async () => {
      const params = new URLSearchParams({
        offset: String(options.offset || 0),
        limit: String(options.limit || 100),
      })

      if (options.fields && options.fields.length > 0) {
        params.append('fields', options.fields.join(','))
      }

      try {
        const response = await fetch(`${SEMANTIC_SCHOLAR_API_BASE}/author/${authorId}/papers?${params.toString()}`, {
          headers: buildHeaders(),
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`Semantic Scholar API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error getting author papers:', error)
        return null
      }
    }),
    CACHE_TTL.AUTHOR
  )
}

/**
 * Get paper recommendations based on a paper
 */
export async function getRecommendations(
  paperId: string,
  options: {
    limit?: number
    fields?: string[]
  } = {}
): Promise<SemanticScholarPaper[]> {
  const paper = await getPaper(paperId, {
    fields: ['title', 'abstract', 'fieldsOfStudy'],
  })

  if (!paper || !paper.fieldsOfStudy) {
    return []
  }

  // Search for similar papers in the same field
  const searchResult = await searchPapers(paper.title || '', {
    limit: options.limit || 10,
    fields: options.fields,
    fieldsOfStudy: paper.fieldsOfStudy,
  })

  if (!searchResult) {
    return []
  }

  // Filter out the original paper
  return searchResult.data.filter((p) => p.paperId !== paperId)
}

/**
 * Extract citation metadata from Semantic Scholar paper
 * 
 * Note: Author name parsing uses a simple "last word is family name" heuristic,
 * which may not work correctly for names with particles (e.g., "van der Waals").
 * This is a known limitation inherited from the Semantic Scholar API's name format.
 */
export function extractCitationMetadata(paper: SemanticScholarPaper) {
  const authors = paper.authors?.map((a) => {
    const nameParts = a.name.split(' ')
    return {
      given: nameParts.slice(0, -1).join(' '),
      family: nameParts.slice(-1)[0] || '',
    }
  }) || []

  return {
    doi: paper.externalIds?.DOI,
    url: paper.url,
    title: paper.title || '',
    authors,
    journal: paper.venue || paper.journal?.name || '',
    year: paper.year,
    volume: paper.journal?.volume,
    pages: paper.journal?.pages,
    abstract: paper.abstract,
    type: paper.publicationTypes?.[0],
    citationCount: paper.citationCount || 0,
    influentialCitations: paper.influentialCitationCount || 0,
    openAccess: paper.isOpenAccess || false,
    pdfUrl: paper.openAccessPdf?.url,
  }
}

/**
 * Calculate h-index for a set of papers
 */
export function calculateHIndex(papers: SemanticScholarPaper[]): number {
  // Sort papers by citation count descending
  const sortedCitations = papers
    .map((p) => p.citationCount || 0)
    .sort((a, b) => b - a)

  let hIndex = 0
  for (let i = 0; i < sortedCitations.length; i++) {
    if (sortedCitations[i] >= i + 1) {
      hIndex = i + 1
    } else {
      break
    }
  }

  return hIndex
}
