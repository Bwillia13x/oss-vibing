/**
 * Unified API Client
 * 
 * Provides a unified interface for all external academic API calls with:
 * - Automatic retries with exponential backoff
 * - Rate limiting
 * - Response caching
 * - Error handling
 * - Performance monitoring
 */

import { trackApiPerformance } from '@/lib/monitoring'

export interface ApiClientOptions {
  maxRetries?: number
  retryDelay?: number
  timeout?: number
  cacheEnabled?: boolean
  cacheTTL?: number
}

export interface ApiResponse<T> {
  data: T | null
  error?: string
  fromCache?: boolean
  responseTime?: number
}

const DEFAULT_OPTIONS: Required<ApiClientOptions> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  cacheEnabled: true,
  cacheTTL: 3600, // 1 hour in seconds
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>()

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate cache key from URL and options
 */
function getCacheKey(url: string, options?: RequestInit): string {
  const optionsKey = options ? JSON.stringify(options) : ''
  return `${url}:${optionsKey}`
}

/**
 * Check if cached data is still valid
 */
function isCacheValid(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp < ttl * 1000
}

/**
 * Unified fetch with retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  options: ApiClientOptions & RequestInit = {},
  apiName: string = 'api'
): Promise<ApiResponse<T>> {
  const config = { ...DEFAULT_OPTIONS, ...options }
  const cacheKey = getCacheKey(url, options)

  // Check cache first
  if (config.cacheEnabled) {
    const cached = cache.get(cacheKey)
    if (cached && isCacheValid(cached.timestamp, config.cacheTTL)) {
      return {
        data: cached.data as T,
        fromCache: true,
      }
    }
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const startTime = Date.now()
      
      // Set timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)

      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            ...options.headers,
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          // Handle rate limiting (429) with exponential backoff
          if (response.status === 429 && attempt < config.maxRetries) {
            const retryAfter = response.headers.get('Retry-After')
            const delay = retryAfter 
              ? parseInt(retryAfter) * 1000 
              : config.retryDelay * Math.pow(2, attempt)
            
            await sleep(delay)
            continue
          }

          // For 404 and other client errors, don't retry
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            return {
              data: null,
              error: `HTTP ${response.status}: ${response.statusText}`,
            }
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json() as T
        const responseTime = Date.now() - startTime

        // Cache successful responses
        if (config.cacheEnabled) {
          cache.set(cacheKey, { data, timestamp: Date.now() })
        }

        // Track performance
        trackApiPerformance(`${apiName}.fetch`, async () => data)

        return {
          data,
          responseTime,
        }
      } catch (fetchError) {
        clearTimeout(timeoutId)
        throw fetchError
      }
    } catch (error) {
      lastError = error as Error

      // Don't retry on certain errors
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return {
            data: null,
            error: `Request timeout after ${config.timeout}ms`,
          }
        }
      }

      // If we've exhausted retries, break
      if (attempt === config.maxRetries) {
        break
      }

      // Exponential backoff
      const delay = config.retryDelay * Math.pow(2, attempt)
      await sleep(delay)
    }
  }

  return {
    data: null,
    error: lastError?.message || 'Unknown error occurred',
  }
}

/**
 * Clear cache for a specific key or all cache
 */
export function clearCache(key?: string): void {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number
  entries: number
} {
  let totalSize = 0
  cache.forEach(entry => {
    totalSize += JSON.stringify(entry.data).length
  })

  return {
    size: totalSize,
    entries: cache.size,
  }
}

/**
 * Clean expired cache entries
 */
export function cleanExpiredCache(ttl: number = DEFAULT_OPTIONS.cacheTTL): number {
  let cleaned = 0
  const now = Date.now()

  cache.forEach((entry, key) => {
    if (!isCacheValid(entry.timestamp, ttl)) {
      cache.delete(key)
      cleaned++
    }
  })

  return cleaned
}

// Run cache cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cleanExpiredCache()
  }, 5 * 60 * 1000)
}
