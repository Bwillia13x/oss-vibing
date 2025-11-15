/**
 * Cached API Client Wrappers - Phase 13
 * 
 * Provides cached versions of API calls to improve performance
 * and reduce load on external services.
 * 
 * @module lib/cache/api-cache
 */

import { redisCache } from './redis-cache'
import { crossrefClient, type CrossrefWork } from '../citations/crossref-client'
import { openAlexClient, type OpenAlexWork } from '../citations/openalex-client'
import { semanticScholarClient, type SemanticScholarPaper } from '../citations/semantic-scholar-client'

/**
 * Cache TTL constants (in seconds)
 */
const CACHE_TTL = {
  CROSSREF_DOI: 7 * 24 * 3600, // 7 days - DOI metadata rarely changes
  CROSSREF_SEARCH: 1 * 3600, // 1 hour - search results update frequently
  GROBID_RESULT: -1, // Permanent - PDF processing is deterministic
  OPENALEX_SEARCH: 1 * 3600, // 1 hour
  OPENALEX_WORK: 7 * 24 * 3600, // 7 days
  SEMANTIC_SCHOLAR: 2 * 3600, // 2 hours
  SEMANTIC_SCHOLAR_PAPER: 7 * 24 * 3600, // 7 days
} as const

/**
 * Cached Crossref DOI lookup
 * 
 * @param doi - Digital Object Identifier
 * @returns Work metadata or null if not found
 * 
 * @example
 * const work = await cachedCrossrefLookup('10.1038/nature12373')
 */
export async function cachedCrossrefLookup(
  doi: string
): Promise<CrossrefWork | null> {
  const cacheKey = `crossref:doi:${doi}`

  // Check cache first
  const cached = await redisCache.get<CrossrefWork>(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch from API
  const result = await crossrefClient.resolveDOI(doi)

  // Cache result (7 days - citations don't change often)
  if (result) {
    await redisCache.set(cacheKey, result, CACHE_TTL.CROSSREF_DOI)
  }

  return result
}

/**
 * Cached Crossref search
 * 
 * @param query - Search query
 * @param limit - Maximum number of results
 * @returns Array of work metadata
 */
export async function cachedCrossrefSearch(
  query: string,
  limit = 20
): Promise<CrossrefWork[]> {
  const cacheKey = `crossref:search:${query}:${limit}`

  // Check cache first
  const cached = await redisCache.get<CrossrefWork[]>(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch from API
  const result = await crossrefClient.search(query, limit)

  // Cache result for 1 hour
  if (result && result.length > 0) {
    await redisCache.set(cacheKey, result, CACHE_TTL.CROSSREF_SEARCH)
  }

  return result
}

/**
 * Cached Crossref author search
 * 
 * @param author - Author name
 * @param limit - Maximum number of results
 * @returns Array of work metadata
 */
export async function cachedCrossrefAuthorSearch(
  author: string,
  limit = 20
): Promise<CrossrefWork[]> {
  const cacheKey = `crossref:author:${author}:${limit}`

  // Check cache first
  const cached = await redisCache.get<CrossrefWork[]>(cacheKey)
  if (cached) {
    return cached
  }

  // Fetch from API
  const result = await crossrefClient.searchByAuthor(author, limit)

  // Cache result for 1 hour
  if (result && result.length > 0) {
    await redisCache.set(cacheKey, result, CACHE_TTL.CROSSREF_SEARCH)
  }

  return result
}

/**
 * Clear all Crossref cached data
 */
export async function clearCrossrefCache(): Promise<void> {
  await redisCache.clear('crossref:*')
}

/**
 * Cached OpenAlex work lookup
 * 
 * @param workId - OpenAlex work ID or DOI
 * @returns Work metadata or null if not found
 */
export async function cachedOpenAlexLookup(
  workId: string
): Promise<OpenAlexWork | null> {
  const cacheKey = `openalex:work:${workId}`

  const cached = await redisCache.get<OpenAlexWork>(cacheKey)
  if (cached) {
    return cached
  }

  const result = await openAlexClient.getWork(workId)

  if (result) {
    await redisCache.set(cacheKey, result, CACHE_TTL.OPENALEX_WORK)
  }

  return result
}

/**
 * Cached OpenAlex search
 * 
 * @param query - Search query
 * @param options - Search options
 * @returns Array of work metadata
 */
export async function cachedOpenAlexSearch(
  query: string,
  options: {
    limit?: number
    yearRange?: { start: number; end: number }
    openAccessOnly?: boolean
  } = {}
): Promise<OpenAlexWork[]> {
  const cacheKey = `openalex:search:${query}:${JSON.stringify(options)}`

  const cached = await redisCache.get<OpenAlexWork[]>(cacheKey)
  if (cached) {
    return cached
  }

  const result = await openAlexClient.searchWorks(query, options)

  if (result && result.length > 0) {
    await redisCache.set(cacheKey, result, CACHE_TTL.OPENALEX_SEARCH)
  }

  return result
}

/**
 * Cached Semantic Scholar paper lookup
 * 
 * @param paperId - Paper ID or DOI
 * @returns Paper metadata or null if not found
 */
export async function cachedSemanticScholarLookup(
  paperId: string
): Promise<SemanticScholarPaper | null> {
  const cacheKey = `semanticscholar:paper:${paperId}`

  const cached = await redisCache.get<SemanticScholarPaper>(cacheKey)
  if (cached) {
    return cached
  }

  const result = await semanticScholarClient.getPaper(paperId)

  if (result) {
    await redisCache.set(cacheKey, result, CACHE_TTL.SEMANTIC_SCHOLAR_PAPER)
  }

  return result
}

/**
 * Cached Semantic Scholar search
 * 
 * @param query - Search query
 * @param options - Search options
 * @returns Array of papers
 */
export async function cachedSemanticScholarSearch(
  query: string,
  options: {
    limit?: number
    yearRange?: { start: number; end: number }
  } = {}
): Promise<SemanticScholarPaper[]> {
  const cacheKey = `semanticscholar:search:${query}:${JSON.stringify(options)}`

  const cached = await redisCache.get<SemanticScholarPaper[]>(cacheKey)
  if (cached) {
    return cached
  }

  const result = await semanticScholarClient.searchPapers(query, options)

  if (result && result.length > 0) {
    await redisCache.set(cacheKey, result, CACHE_TTL.SEMANTIC_SCHOLAR)
  }

  return result
}

/**
 * Clear all OpenAlex cached data
 */
export async function clearOpenAlexCache(): Promise<void> {
  await redisCache.clear('openalex:*')
}

/**
 * Clear all Semantic Scholar cached data
 */
export async function clearSemanticScholarCache(): Promise<void> {
  await redisCache.clear('semanticscholar:*')
}

/**
 * Generic cached fetch with TTL
 * 
 * @param cacheKey - Cache key
 * @param fetchFn - Function to fetch data if not cached
 * @param ttlSeconds - Cache TTL in seconds
 * @returns Cached or fresh data
 */
export async function cachedFetch<T>(
  cacheKey: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Check cache first
  const cached = await redisCache.get<T>(cacheKey)
  if (cached !== null) {
    return cached
  }

  // Fetch fresh data
  const result = await fetchFn()

  // Cache result
  if (result !== null && result !== undefined) {
    await redisCache.set(cacheKey, result, ttlSeconds)
  }

  return result
}

/**
 * Batch fetch with caching
 * 
 * Fetches multiple items, checking cache first and only
 * fetching missing items from the source.
 * 
 * @param keys - Array of keys to fetch
 * @param cachePrefix - Prefix for cache keys
 * @param fetchFn - Function to fetch missing items
 * @param ttlSeconds - Cache TTL in seconds
 * @returns Map of key to result
 */
export async function batchCachedFetch<T>(
  keys: string[],
  cachePrefix: string,
  fetchFn: (keys: string[]) => Promise<Map<string, T>>,
  ttlSeconds: number
): Promise<Map<string, T>> {
  const results = new Map<string, T>()
  const missingKeys: string[] = []

  // Check cache for each key
  for (const key of keys) {
    const cacheKey = `${cachePrefix}:${key}`
    const cached = await redisCache.get<T>(cacheKey)

    if (cached !== null) {
      results.set(key, cached)
    } else {
      missingKeys.push(key)
    }
  }

  // Fetch missing items
  if (missingKeys.length > 0) {
    const fetchedResults = await fetchFn(missingKeys)

    // Cache and add to results
    for (const [key, value] of fetchedResults.entries()) {
      const cacheKey = `${cachePrefix}:${key}`
      await redisCache.set(cacheKey, value, ttlSeconds)
      results.set(key, value)
    }
  }

  return results
}

/**
 * Invalidate cache by pattern
 * 
 * @param pattern - Cache key pattern (supports wildcards)
 * 
 * @example
 * await invalidateCache('crossref:*') // Clear all Crossref cache
 * await invalidateCache('openalex:search:*') // Clear OpenAlex searches
 */
export async function invalidateCache(pattern: string): Promise<void> {
  await redisCache.clear(pattern)
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
  return redisCache.getStats()
}
