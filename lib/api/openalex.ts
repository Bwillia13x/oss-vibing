/**
 * OpenAlex API Client
 * 
 * Provides access to the OpenAlex API for comprehensive academic literature search.
 * OpenAlex is a free and open catalog of scholarly papers, authors, institutions, and more.
 * 
 * API Documentation: https://docs.openalex.org
 * Rate Limiting: 100,000 requests/day (no API key required), unlimited with polite pool
 * 
 * @module lib/api/openalex
 */

import { trackApiPerformance } from '@/lib/monitoring'
import { getOrSetCached, generateCacheKey, DEFAULT_TTL } from '@/lib/cache'

const OPENALEX_API_BASE = 'https://api.openalex.org'
const POLITE_EMAIL = process.env.POLITE_EMAIL || 'support@vibeuniversity.com'
const USER_AGENT = `VibeUniversity/0.1 (mailto:${POLITE_EMAIL})`

// Cache TTLs
const CACHE_TTL = {
  WORK_LOOKUP: DEFAULT_TTL.DAY, // Work metadata rarely changes
  AUTHOR_LOOKUP: DEFAULT_TTL.DAY, // Author data rarely changes
  SEARCH: DEFAULT_TTL.LONG, // Search results can change more frequently
}

export interface OpenAlexWork {
  id: string // OpenAlex ID (e.g., https://openalex.org/W2741809807)
  doi?: string
  title?: string
  display_name?: string
  publication_year?: number
  publication_date?: string
  type?: string // article, book-chapter, etc.
  open_access?: {
    is_oa: boolean
    oa_status: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed'
    oa_url?: string
  }
  authorships?: Array<{
    author_position: string
    author: {
      id: string
      display_name: string
      orcid?: string
    }
    institutions?: Array<{
      id: string
      display_name: string
      country_code?: string
      type?: string
    }>
  }>
  primary_location?: {
    source?: {
      id: string
      display_name: string
      issn_l?: string
      issn?: string[]
      type?: string // journal, repository, etc.
    }
    landing_page_url?: string
    pdf_url?: string
    version?: string
  }
  biblio?: {
    volume?: string
    issue?: string
    first_page?: string
    last_page?: string
  }
  cited_by_count?: number
  cited_by_percentile_year?: {
    min: number
    max: number
  }
  concepts?: Array<{
    id: string
    wikidata?: string
    display_name: string
    level: number // 0-5, higher = more specific
    score: number // relevance score 0-1
  }>
  abstract_inverted_index?: Record<string, number[]>
  referenced_works?: string[] // OpenAlex IDs
  related_works?: string[] // OpenAlex IDs
}

export interface OpenAlexAuthor {
  id: string
  orcid?: string
  display_name: string
  display_name_alternatives?: string[]
  works_count?: number
  cited_by_count?: number
  h_index?: number
  i10_index?: number
  summary_stats?: {
    '2yr_mean_citedness': number
    h_index: number
    i10_index: number
  }
  last_known_institution?: {
    id: string
    display_name: string
    country_code?: string
  }
}

export interface OpenAlexSearchResult {
  results: OpenAlexWork[]
  meta: {
    count: number
    db_response_time_ms: number
    page: number
    per_page: number
  }
}

/**
 * Search for works by query (with caching)
 */
export async function searchWorks(
  query: string,
  options: {
    page?: number
    perPage?: number
    sort?: 'relevance_score' | 'cited_by_count' | 'publication_date' | 'works_count'
    filter?: Record<string, string | number>
  } = {}
): Promise<OpenAlexSearchResult | null> {
  const cacheKey = generateCacheKey('openalex', 'search', query, options)
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('openalex.search', async () => {
      const params = new URLSearchParams({
        search: query,
        page: String(options.page || 1),
        per_page: String(options.perPage || 25),
      })

      if (options.sort) {
        params.append('sort', options.sort)
      }

      if (options.filter) {
        const filters = Object.entries(options.filter)
          .map(([key, value]) => `${key}:${value}`)
          .join(',')
        if (filters) {
          params.append('filter', filters)
        }
      }

      try {
        const response = await fetch(`${OPENALEX_API_BASE}/works?${params.toString()}`, {
          headers: {
            'User-Agent': USER_AGENT,
          },
        })

        if (!response.ok) {
          throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        return data
      } catch (error) {
        console.error('Error searching OpenAlex:', error)
        return null
      }
    }),
    CACHE_TTL.SEARCH
  )
}

/**
 * Get a work by DOI (with caching)
 */
export async function getWorkByDOI(doi: string): Promise<OpenAlexWork | null> {
  const cleanDOI = doi.trim().replace(/^https?:\/\/doi\.org\//, '')
  const cacheKey = generateCacheKey('openalex', 'doi', cleanDOI)
  
  return getOrSetCached(
    cacheKey,
    () => trackApiPerformance('openalex.getWorkByDOI', async () => {
      try {
        const response = await fetch(`${OPENALEX_API_BASE}/works/doi:${encodeURIComponent(cleanDOI)}`, {
          headers: {
            'User-Agent': USER_AGENT,
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            return null
          }
          throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
      } catch (error) {
        console.error('Error getting work by DOI:', error)
        return null
      }
    }),
    CACHE_TTL.WORK_LOOKUP
  )
}

/**
 * Get a work by OpenAlex ID
 */
export async function getWorkByID(id: string): Promise<OpenAlexWork | null> {
  return trackApiPerformance('openalex.getWorkByID', async () => {
    try {
      const response = await fetch(`${OPENALEX_API_BASE}/works/${id}`, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting work by ID:', error)
      return null
    }
  })
}

/**
 * Search for authors
 */
export async function searchAuthors(
  query: string,
  options: { page?: number; perPage?: number } = {}
): Promise<{ results: OpenAlexAuthor[]; meta: any } | null> {
  const params = new URLSearchParams({
    search: query,
    page: String(options.page || 1),
    per_page: String(options.perPage || 25),
  })

  return trackApiPerformance('openalex.searchAuthors', async () => {
    try {
      const response = await fetch(`${OPENALEX_API_BASE}/authors?${params.toString()}`, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      })

      if (!response.ok) {
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error searching authors:', error)
      return null
    }
  })
}

/**
 * Get an author by ID or ORCID
 */
export async function getAuthor(idOrOrcid: string): Promise<OpenAlexAuthor | null> {
  return trackApiPerformance('openalex.getAuthor', async () => {
    try {
      const response = await fetch(`${OPENALEX_API_BASE}/authors/${idOrOrcid}`, {
        headers: {
          'User-Agent': USER_AGENT,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error(`OpenAlex API error: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error getting author:', error)
      return null
    }
  })
}

/**
 * Get works by a specific author
 */
export async function getWorksByAuthor(
  authorId: string,
  options: { page?: number; perPage?: number } = {}
): Promise<OpenAlexSearchResult | null> {
  return searchWorks('', {
    ...options,
    filter: { 'author.id': authorId },
  })
}

/**
 * Get open access papers
 */
export async function getOpenAccessWorks(
  query: string,
  options: { page?: number; perPage?: number } = {}
): Promise<OpenAlexSearchResult | null> {
  return searchWorks(query, {
    ...options,
    filter: { 'is_oa': 'true' },
  })
}

/**
 * Get works by publication year
 */
export async function getWorksByYear(
  year: number,
  options: { page?: number; perPage?: number } = {}
): Promise<OpenAlexSearchResult | null> {
  return searchWorks('', {
    ...options,
    filter: { 'publication_year': year },
  })
}

/**
 * Get works by topic/concept
 */
export async function getWorksByConcept(
  conceptId: string,
  options: { page?: number; perPage?: number } = {}
): Promise<OpenAlexSearchResult | null> {
  return searchWorks('', {
    ...options,
    filter: { 'concepts.id': conceptId },
  })
}

/**
 * Get related works for a given work
 */
export async function getRelatedWorks(workId: string): Promise<OpenAlexWork[]> {
  const work = await getWorkByID(workId)
  if (!work || !work.related_works) {
    return []
  }

  const relatedWorkPromises = work.related_works.slice(0, 10).map((id) => getWorkByID(id))
  const relatedWorks = await Promise.all(relatedWorkPromises)
  
  return relatedWorks.filter((w): w is OpenAlexWork => w !== null)
}

/**
 * Get citations (works that cite this work)
 */
export async function getCitations(
  workId: string,
  options: { page?: number; perPage?: number } = {}
): Promise<OpenAlexSearchResult | null> {
  return searchWorks('', {
    ...options,
    filter: { 'cites': workId },
  })
}

/**
 * Get references (works cited by this work)
 */
export async function getReferences(workId: string): Promise<OpenAlexWork[]> {
  const work = await getWorkByID(workId)
  if (!work || !work.referenced_works) {
    return []
  }

  const refWorkPromises = work.referenced_works.slice(0, 50).map((id) => getWorkByID(id))
  const refWorks = await Promise.all(refWorkPromises)
  
  return refWorks.filter((w): w is OpenAlexWork => w !== null)
}

/**
 * Extract abstract from inverted index
 */
export function extractAbstract(work: OpenAlexWork): string {
  if (!work.abstract_inverted_index) {
    return ''
  }

  const words: Array<{ word: string; positions: number[] }> = []
  
  for (const [word, positions] of Object.entries(work.abstract_inverted_index)) {
    words.push({ word, positions })
  }

  // Sort by position
  const sortedWords = words
    .flatMap(({ word, positions }) => positions.map((pos) => ({ word, pos })))
    .sort((a, b) => a.pos - b.pos)
    .map(({ word }) => word)

  return sortedWords.join(' ')
}

/**
 * Extract citation metadata from OpenAlex work
 * 
 * Note: Author name parsing uses a simple "last word is family name" heuristic,
 * which may not work correctly for names with particles (e.g., "van Gogh", "de la Cruz").
 * This is a known limitation inherited from the OpenAlex API's name format.
 */
export function extractCitationMetadata(work: OpenAlexWork) {
  const authors = work.authorships?.map((a) => ({
    given: a.author.display_name.split(' ').slice(0, -1).join(' '),
    family: a.author.display_name.split(' ').slice(-1)[0],
  })) || []

  return {
    doi: work.doi,
    url: work.primary_location?.landing_page_url,
    title: work.display_name || work.title || '',
    authors,
    journal: work.primary_location?.source?.display_name || '',
    year: work.publication_year,
    volume: work.biblio?.volume,
    issue: work.biblio?.issue,
    pages: work.biblio?.first_page && work.biblio?.last_page 
      ? `${work.biblio.first_page}-${work.biblio.last_page}`
      : work.biblio?.first_page,
    abstract: extractAbstract(work),
    type: work.type,
    citationCount: work.cited_by_count || 0,
    openAccess: work.open_access?.is_oa || false,
    pdfUrl: work.primary_location?.pdf_url,
  }
}
