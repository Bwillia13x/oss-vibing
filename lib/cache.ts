/**
 * Simple in-memory cache for Phase 3.1.2 Backend Performance
 * Provides request memoization without external dependencies like Redis
 * Suitable for development and low-traffic scenarios
 */

interface CacheEntry<T> {
  value: T
  timestamp: number
  hits: number
}

class SimpleCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private maxSize: number
  private ttl: number

  constructor(maxSize = 1000, ttlSeconds = 300) {
    this.maxSize = maxSize
    this.ttl = ttlSeconds * 1000
  }

  /**
   * Get a value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return null
    }

    // Update hit count
    entry.hits++
    return entry.value
  }

  /**
   * Set a value in cache
   */
  set(key: string, value: T): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      hits: 0,
    })
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  stats() {
    let totalHits = 0
    let validEntries = 0

    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp <= this.ttl) {
        validEntries++
        totalHits += entry.hits
      }
    }

    return {
      size: this.cache.size,
      validEntries,
      totalHits,
      hitRate: validEntries > 0 ? totalHits / validEntries : 0,
    }
  }

  /**
   * Evict oldest entry (LRU-like behavior)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }
}

// Global cache instances
export const apiCache = new SimpleCache(1000, 300) // 5 minutes TTL
export const dataCache = new SimpleCache(500, 600) // 10 minutes TTL

/**
 * Memoization decorator for expensive functions
 */
export function memoize<T>(
  fn: (...args: any[]) => T | Promise<T>,
  ttlSeconds = 300
): (...args: any[]) => T | Promise<T> {
  const cache = new SimpleCache<T>(100, ttlSeconds)

  return function (this: any, ...args: any[]): T | Promise<T> {
    const key = JSON.stringify(args)
    const cached = cache.get(key)

    if (cached !== null) {
      return cached
    }

    const result = fn.apply(this, args)

    // Handle async functions
    if (result instanceof Promise) {
      return result.then((value) => {
        cache.set(key, value)
        return value
      })
    }

    cache.set(key, result)
    return result
  }
}

/**
 * Cache-aside pattern helper
 */
export async function cacheAside<T>(
  key: string,
  fetcher: () => Promise<T>,
  cache: SimpleCache<T> = apiCache
): Promise<T> {
  // Try to get from cache
  const cached = cache.get(key)
  if (cached !== null) {
    return cached
  }

  // Fetch and cache
  const value = await fetcher()
  cache.set(key, value)
  return value
}

/**
 * Rate limiter using in-memory store
 */
export class RateLimiter {
  private requests = new Map<string, number[]>()
  private maxRequests: number
  private windowMs: number

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): boolean {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []

    // Remove old requests outside the window
    const validRequests = requests.filter((time) => now - time < this.windowMs)

    // Check if limit exceeded
    if (validRequests.length >= this.maxRequests) {
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)

    return true
  }

  /**
   * Get remaining requests for identifier
   */
  remaining(identifier: string): number {
    const now = Date.now()
    const requests = this.requests.get(identifier) || []
    const validRequests = requests.filter((time) => now - time < this.windowMs)
    return Math.max(0, this.maxRequests - validRequests.length)
  }

  /**
   * Reset rate limit for identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier)
  }

  /**
   * Clean up old entries
   */
  cleanup(): void {
    const now = Date.now()
    for (const [identifier, requests] of this.requests.entries()) {
      const validRequests = requests.filter(
        (time) => now - time < this.windowMs
      )
      if (validRequests.length === 0) {
        this.requests.delete(identifier)
      } else {
        this.requests.set(identifier, validRequests)
      }
    }
  }
}

// Global rate limiter for API routes
export const apiRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute

// Cleanup old rate limit entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => apiRateLimiter.cleanup(), 300000)
}
