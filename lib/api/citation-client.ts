/**
 * Unified Citation API Client
 * 
 * Provides a single interface to all academic citation APIs with automatic
 * provider selection, failover, and caching.
 * 
 * Supported providers:
 * - Crossref: DOI resolution, citation metadata
 * - OpenAlex: Comprehensive literature search
 * - Semantic Scholar: Citation networks, influential citations
 * 
 * @module lib/api/citation-client
 */

import * as Crossref from './crossref'
import * as OpenAlex from './openalex'
import * as SemanticScholar from './semantic-scholar'

export interface UnifiedPaper {
  id: string // Provider-specific ID
  doi?: string
  title: string
  authors: Array<{
    given: string
    family: string
  }>
  journal?: string
  year?: number
  volume?: string
  issue?: string
  pages?: string
  abstract?: string
  type?: string
  citationCount: number
  openAccess?: boolean
  pdfUrl?: string
  url?: string
  provider: 'crossref' | 'openalex' | 'semanticscholar'
}

export interface CitationAPIOptions {
  preferredProvider?: 'crossref' | 'openalex' | 'semanticscholar'
  enableCaching?: boolean
  timeout?: number
}

// In-memory cache (in production, use Redis)
// Note: This cache will grow until entries expire (24h TTL). For production,
// consider implementing an LRU cache with max size or migrating to Redis.
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

/**
 * Get cached data if available and not expired
 */
function getCache<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key)
    return null
  }

  return cached.data as T
}

/**
 * Set cache data
 */
function setCache(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() })
}

/**
 * Look up a paper by DOI using multiple providers with fallback
 */
export async function lookupDOI(
  doi: string,
  options: CitationAPIOptions = {}
): Promise<UnifiedPaper | null> {
  const cacheKey = `doi:${doi}`

  // Check cache
  if (options.enableCaching !== false) {
    const cached = getCache<UnifiedPaper>(cacheKey)
    if (cached) return cached
  }

  // Try providers in order
  const providers = getProviderOrder(options.preferredProvider)

  for (const provider of providers) {
    try {
      let paper: UnifiedPaper | null = null

      switch (provider) {
        case 'crossref':
          const crossrefWork = await Crossref.lookupDOI(doi)
          if (crossrefWork) {
            paper = crossrefToUnified(crossrefWork)
          }
          break

        case 'openalex':
          const openalexWork = await OpenAlex.getWorkByDOI(doi)
          if (openalexWork) {
            paper = openalexToUnified(openalexWork)
          }
          break

        case 'semanticscholar':
          const ssWork = await SemanticScholar.getPaperByDOI(doi)
          if (ssWork) {
            paper = semanticScholarToUnified(ssWork)
          }
          break
      }

      if (paper) {
        if (options.enableCaching !== false) {
          setCache(cacheKey, paper)
        }
        return paper
      }
    } catch (error) {
      console.error(`Error fetching from ${provider}:`, error)
      // Continue to next provider
    }
  }

  return null
}

/**
 * Search for papers across providers
 */
export async function searchPapers(
  query: string,
  options: CitationAPIOptions & {
    limit?: number
    offset?: number
  } = {}
): Promise<UnifiedPaper[]> {
  const cacheKey = `search:${query}:${options.limit || 10}:${options.offset || 0}`

  // Check cache
  if (options.enableCaching !== false) {
    const cached = getCache<UnifiedPaper[]>(cacheKey)
    if (cached) return cached
  }

  const limit = options.limit || 10
  const offset = options.offset || 0
  const providers = getProviderOrder(options.preferredProvider)

  for (const provider of providers) {
    try {
      let papers: UnifiedPaper[] = []

      switch (provider) {
        case 'crossref':
          const crossrefResult = await Crossref.searchWorks(query, {
            rows: limit,
            offset,
          })
          if (crossrefResult) {
            papers = crossrefResult.items.map(crossrefToUnified)
          }
          break

        case 'openalex':
          const openalexResult = await OpenAlex.searchWorks(query, {
            perPage: limit,
            page: Math.floor(offset / limit) + 1,
          })
          if (openalexResult) {
            papers = openalexResult.results.map(openalexToUnified)
          }
          break

        case 'semanticscholar':
          const ssResult = await SemanticScholar.searchPapers(query, {
            limit,
            offset,
          })
          if (ssResult) {
            papers = ssResult.data.map(semanticScholarToUnified)
          }
          break
      }

      if (papers.length > 0) {
        if (options.enableCaching !== false) {
          setCache(cacheKey, papers)
        }
        return papers
      }
    } catch (error) {
      console.error(`Error searching ${provider}:`, error)
      // Continue to next provider
    }
  }

  return []
}

/**
 * Get citation count for a paper
 */
export async function getCitationCount(doi: string): Promise<number> {
  const paper = await lookupDOI(doi)
  return paper?.citationCount || 0
}

/**
 * Check if a DOI is valid
 */
export async function validateDOI(doi: string): Promise<boolean> {
  const paper = await lookupDOI(doi)
  return paper !== null
}

/**
 * Get open access PDF URL if available
 */
export async function getOpenAccessPDF(doi: string): Promise<string | null> {
  // Try OpenAlex first (best for open access)
  const openalexWork = await OpenAlex.getWorkByDOI(doi)
  if (openalexWork?.primary_location?.pdf_url) {
    return openalexWork.primary_location.pdf_url
  }

  // Try Semantic Scholar
  const ssWork = await SemanticScholar.getPaperByDOI(doi)
  if (ssWork?.openAccessPdf?.url) {
    return ssWork.openAccessPdf.url
  }

  return null
}

/**
 * Get papers by author name
 */
export async function getWorksByAuthor(
  authorName: string,
  options: CitationAPIOptions & { limit?: number } = {}
): Promise<UnifiedPaper[]> {
  const limit = options.limit || 20
  const provider = options.preferredProvider || 'openalex'

  try {
    switch (provider) {
      case 'crossref':
        const crossrefResult = await Crossref.getWorksByAuthor(authorName, {
          rows: limit,
        })
        if (crossrefResult) {
          return crossrefResult.items.map(crossrefToUnified)
        }
        break

      case 'openalex':
        // First search for author
        const authorResult = await OpenAlex.searchAuthors(authorName, {
          perPage: 1,
        })
        if (authorResult && authorResult.results.length > 0) {
          const author = authorResult.results[0]
          const worksResult = await OpenAlex.getWorksByAuthor(author.id, {
            perPage: limit,
          })
          if (worksResult) {
            return worksResult.results.map(openalexToUnified)
          }
        }
        break

      case 'semanticscholar':
        const ssAuthorResult = await SemanticScholar.searchAuthors(authorName, {
          limit: 1,
        })
        if (ssAuthorResult && ssAuthorResult.data.length > 0) {
          const author = ssAuthorResult.data[0]
          const papersResult = await SemanticScholar.getAuthorPapers(author.authorId, {
            limit,
          })
          if (papersResult) {
            return papersResult.data.map(semanticScholarToUnified)
          }
        }
        break
    }
  } catch (error) {
    console.error(`Error getting works by author from ${provider}:`, error)
  }

  return []
}

/**
 * Get citation network for a paper
 * 
 * Note: This function uses Semantic Scholar exclusively as it provides the most
 * comprehensive citation network data. Other providers (Crossref, OpenAlex) have
 * limited or no direct citation graph APIs, so no failover is implemented.
 */
export async function getCitationNetwork(
  doi: string
): Promise<{
  paper: UnifiedPaper
  citations: UnifiedPaper[]
  references: UnifiedPaper[]
} | null> {
  // Use Semantic Scholar for citation networks (best support)
  const ssWork = await SemanticScholar.getPaperByDOI(doi)
  if (!ssWork) return null

  const [citationsResult, referencesResult] = await Promise.all([
    SemanticScholar.getCitations(ssWork.paperId, { limit: 50 }),
    SemanticScholar.getReferences(ssWork.paperId, { limit: 50 }),
  ])

  return {
    paper: semanticScholarToUnified(ssWork),
    citations: citationsResult?.data.map(semanticScholarToUnified) || [],
    references: referencesResult?.data.map(semanticScholarToUnified) || [],
  }
}

/**
 * Get provider order based on preference
 */
function getProviderOrder(
  preferredProvider?: 'crossref' | 'openalex' | 'semanticscholar'
): Array<'crossref' | 'openalex' | 'semanticscholar'> {
  const providers: Array<'crossref' | 'openalex' | 'semanticscholar'> = [
    'crossref',
    'openalex',
    'semanticscholar',
  ]

  if (preferredProvider) {
    // Move preferred to front without mutating providers
    const others = providers.filter(p => p !== preferredProvider)
    return [preferredProvider, ...others]
  }

  return providers
}

/**
 * Convert Crossref work to unified format
 */
function crossrefToUnified(work: Crossref.CrossrefWork): UnifiedPaper {
  const metadata = Crossref.extractCitationMetadata(work)

  return {
    id: work.DOI,
    doi: work.DOI,
    title: metadata.title,
    authors: metadata.authors,
    journal: metadata.journal,
    year: metadata.year,
    volume: metadata.volume,
    issue: metadata.issue,
    pages: metadata.pages,
    abstract: metadata.abstract,
    type: metadata.type,
    citationCount: metadata.citationCount,
    url: metadata.url,
    provider: 'crossref',
  }
}

/**
 * Convert OpenAlex work to unified format
 */
function openalexToUnified(work: OpenAlex.OpenAlexWork): UnifiedPaper {
  const metadata = OpenAlex.extractCitationMetadata(work)

  return {
    id: work.id,
    doi: work.doi,
    title: metadata.title,
    authors: metadata.authors,
    journal: metadata.journal,
    year: metadata.year,
    volume: metadata.volume,
    issue: metadata.issue,
    pages: metadata.pages,
    abstract: metadata.abstract,
    type: metadata.type,
    citationCount: metadata.citationCount,
    openAccess: metadata.openAccess,
    pdfUrl: metadata.pdfUrl,
    url: metadata.url,
    provider: 'openalex',
  }
}

/**
 * Convert Semantic Scholar paper to unified format
 */
function semanticScholarToUnified(
  paper: SemanticScholar.SemanticScholarPaper
): UnifiedPaper {
  const metadata = SemanticScholar.extractCitationMetadata(paper)

  return {
    id: paper.paperId,
    doi: metadata.doi,
    title: metadata.title,
    authors: metadata.authors,
    journal: metadata.journal,
    year: metadata.year,
    volume: metadata.volume,
    pages: metadata.pages,
    abstract: metadata.abstract,
    type: metadata.type,
    citationCount: metadata.citationCount,
    openAccess: metadata.openAccess,
    pdfUrl: metadata.pdfUrl,
    url: metadata.url,
    provider: 'semanticscholar',
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return {
    size: cache.size,
    entries: Array.from(cache.keys()),
  }
}
