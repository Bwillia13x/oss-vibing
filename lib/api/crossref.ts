/**
 * Crossref API Client
 * 
 * Provides access to the Crossref REST API for DOI resolution and citation metadata.
 * 
 * API Documentation: https://www.crossref.org/documentation/retrieve-metadata/rest-api/
 * Rate Limiting: 50 requests/second (polite pool with email in User-Agent)
 * 
 * @module lib/api/crossref
 */

import { trackApiPerformance } from '@/lib/monitoring'

const CROSSREF_API_BASE = 'https://api.crossref.org'
const POLITE_EMAIL = process.env.POLITE_EMAIL || 'support@vibeuniversity.com' // Used for polite pool
const USER_AGENT = `VibeUniversity/0.1 (mailto:${POLITE_EMAIL})`

export interface CrossrefWork {
  DOI: string
  URL?: string
  title?: string[]
  author?: Array<{
    given?: string
    family?: string
    sequence?: string
    affiliation?: Array<{ name: string }>
  }>
  'container-title'?: string[] // Journal name
  'published-print'?: { 'date-parts': number[][] }
  'published-online'?: { 'date-parts': number[][] }
  volume?: string
  issue?: string
  page?: string
  abstract?: string
  subject?: string[]
  type?: string // article-journal, book, etc.
  publisher?: string
  ISSN?: string[]
  ISBN?: string[]
  'is-referenced-by-count'?: number
  reference?: Array<{
    key: string
    DOI?: string
    'article-title'?: string
    author?: string
    year?: string
  }>
}

export interface CrossrefResponse {
  status: string
  'message-type': string
  'message-version': string
  message: CrossrefWork | CrossrefWork[]
}

export interface CrossrefSearchResult {
  items: CrossrefWork[]
  'total-results': number
  'items-per-page': number
  query: {
    'start-index': number
    'search-terms': string
  }
}

/**
 * Look up a work by DOI
 */
export async function lookupDOI(doi: string): Promise<CrossrefWork | null> {
  const cleanDOI = doi.trim().replace(/^https?:\/\/doi\.org\//, '')
  
  return trackApiPerformance('crossref.lookup', async () => {
    try {
      const response = await fetch(`${CROSSREF_API_BASE}/works/${encodeURIComponent(cleanDOI)}`, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`Crossref API error: ${response.status} ${response.statusText}`)
      }

      const data: CrossrefResponse = await response.json()
      return data.message as CrossrefWork
    } catch (error) {
      console.error('Error looking up DOI:', error)
      return null
    }
  })
}

/**
 * Search for works by query string
 */
export async function searchWorks(
  query: string,
  options: {
    rows?: number
    offset?: number
    sort?: 'relevance' | 'score' | 'updated' | 'deposited' | 'indexed' | 'published'
    order?: 'asc' | 'desc'
    filter?: Record<string, string>
  } = {}
): Promise<CrossrefSearchResult | null> {
  const params = new URLSearchParams({
    query: query,
    rows: String(options.rows || 20),
    offset: String(options.offset || 0),
  })

  if (options.sort) {
    params.append('sort', options.sort)
  }
  if (options.order) {
    params.append('order', options.order)
  }
  if (options.filter) {
    for (const [key, value] of Object.entries(options.filter)) {
      params.append(`filter`, `${key}:${value}`)
    }
  }

  return trackApiPerformance('crossref.search', async () => {
    try {
      const response = await fetch(`${CROSSREF_API_BASE}/works?${params.toString()}`, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      })

      if (!response.ok) {
        throw new Error(`Crossref API error: ${response.status} ${response.statusText}`)
      }

      const data: CrossrefResponse = await response.json()
      return data.message as any as CrossrefSearchResult
    } catch (error) {
      console.error('Error searching Crossref:', error)
      return null
    }
  })
}

/**
 * Get works by author
 */
export async function getWorksByAuthor(
  authorName: string,
  options: { rows?: number; offset?: number } = {}
): Promise<CrossrefSearchResult | null> {
  return searchWorks(authorName, {
    ...options,
    filter: { 'has-author': 'true' },
  })
}

/**
 * Get works published in a specific year range
 */
export async function getWorksByYearRange(
  fromYear: number,
  toYear: number,
  options: { rows?: number; offset?: number } = {}
): Promise<CrossrefSearchResult | null> {
  return searchWorks('*', {
    ...options,
    filter: {
      'from-pub-date': `${fromYear}-01-01`,
      'until-pub-date': `${toYear}-12-31`,
    },
  })
}

/**
 * Validate that a DOI exists and is accessible
 */
export async function validateDOI(doi: string): Promise<boolean> {
  const work = await lookupDOI(doi)
  return work !== null
}

/**
 * Extract citation metadata from a Crossref work
 */
export function extractCitationMetadata(work: CrossrefWork) {
  const authors = work.author?.map((a) => ({
    given: a.given || '',
    family: a.family || '',
  })) || []

  const title = work.title?.[0] || ''
  const containerTitle = work['container-title']?.[0] || ''
  
  // Get publication year from either print or online date
  const publishedDate = work['published-print'] || work['published-online']
  const year = publishedDate?.['date-parts']?.[0]?.[0]

  return {
    doi: work.DOI,
    url: work.URL,
    title,
    authors,
    journal: containerTitle,
    year,
    volume: work.volume,
    issue: work.issue,
    pages: work.page,
    abstract: work.abstract,
    publisher: work.publisher,
    type: work.type,
    citationCount: work['is-referenced-by-count'] || 0,
  }
}

/**
 * Format authors for citation (e.g., "Smith, J., & Jones, K.")
 */
export function formatAuthors(
  authors: Array<{ given?: string; family?: string }>,
  maxAuthors: number = 3
): string {
  if (authors.length === 0) {
    return 'Unknown'
  }

  const formattedAuthors = authors.slice(0, maxAuthors).map((author) => {
    const family = author.family || ''
    const given = author.given?.[0] || ''
    return given ? `${family}, ${given}.` : family
  })

  if (authors.length <= maxAuthors) {
    if (formattedAuthors.length === 1) {
      return formattedAuthors[0]
    } else if (formattedAuthors.length === 2) {
      return `${formattedAuthors[0]} & ${formattedAuthors[1]}`
    } else {
      const last = formattedAuthors.pop()
      return `${formattedAuthors.join(', ')}, & ${last}`
    }
  } else {
    return `${formattedAuthors[0]} et al.`
  }
}

/**
 * Get multiple works by DOI in batch (with rate limiting)
 */
export async function batchLookupDOIs(dois: string[]): Promise<Map<string, CrossrefWork | null>> {
  const results = new Map<string, CrossrefWork | null>()
  
  // Rate limit: 50 req/sec (polite pool); using 25ms delay for 40 requests/second (conservative buffer from 50/sec limit)
  const DELAY_MS = 25 // 40 requests/second (conservative buffer from 50/sec limit)
  
  for (let i = 0; i < dois.length; i++) {
    const doi = dois[i]
    const work = await lookupDOI(doi)
    results.set(doi, work)
    
    // Add delay between requests to respect rate limits
    if (i < dois.length - 1) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS))
    }
  }
  
  return results
}

/**
 * Check if a work has been retracted
 */
export async function isRetracted(doi: string): Promise<boolean> {
  const work = await lookupDOI(doi)
  if (!work) return false
  
  // Check for retraction notice in the type or relations
  return work.type === 'retraction' || work.type === 'retracted-article'
}
