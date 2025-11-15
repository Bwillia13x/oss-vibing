/**
 * Redis Cache Client - Phase 13
 * 
 * Provides caching layer for API responses to improve performance
 * and reduce external API calls.
 * 
 * @module lib/cache/redis-cache
 */

import Redis from 'ioredis'

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
  size: number
}

/**
 * Redis Cache Client
 * 
 * Implements caching with TTL and JSON serialization
 */
export class RedisCache {
  private redis: Redis | null = null
  private fallbackCache: Map<string, { value: any; expiry: number }> = new Map()
  private stats = { hits: 0, misses: 0 }

  constructor() {
    this.initRedis()
  }

  /**
   * Initialize Redis connection
   */
  private initRedis(): void {
    // Only initialize if Redis URL is provided
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      console.warn('Redis not configured, using in-memory fallback cache')
      return
    }

    try {
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000)
          return delay
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      })

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error)
        // Fall back to in-memory cache on error
        this.redis = null
      })

      this.redis.on('connect', () => {
        console.log('Redis cache connected')
      })

      // Connect asynchronously
      this.redis.connect().catch((error) => {
        console.error('Failed to connect to Redis:', error)
        this.redis = null
      })
    } catch (error) {
      console.error('Redis initialization error:', error)
      this.redis = null
    }
  }

  /**
   * Get value from cache
   * 
   * @param key - Cache key
   * @returns Cached value or null if not found
   * 
   * @example
   * const citation = await cache.get('crossref:10.1000/xyz')
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      // Try Redis first
      if (this.redis?.status === 'ready') {
        const value = await this.redis.get(key)
        if (value) {
          this.stats.hits++
          return JSON.parse(value) as T
        }
      } else {
        // Use fallback cache
        const cached = this.fallbackCache.get(key)
        if (cached) {
          if (cached.expiry > Date.now()) {
            this.stats.hits++
            return cached.value as T
          } else {
            // Expired entry
            this.fallbackCache.delete(key)
          }
        }
      }

      this.stats.misses++
      return null
    } catch (error) {
      console.error('Cache get error:', error)
      this.stats.misses++
      return null
    }
  }

  /**
   * Set value in cache with TTL
   * 
   * @param key - Cache key
   * @param value - Value to cache (will be JSON serialized)
   * @param ttlSeconds - Time to live in seconds (default: 1 hour)
   * 
   * @example
   * await cache.set('crossref:10.1000/xyz', work, 7 * 24 * 3600) // 7 days
   */
  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value)

      // Try Redis first
      if (this.redis?.status === 'ready') {
        await this.redis.setex(key, ttlSeconds, serialized)
      } else {
        // Use fallback cache
        this.fallbackCache.set(key, {
          value,
          expiry: Date.now() + ttlSeconds * 1000,
        })

        // Clean up expired entries periodically
        if (this.fallbackCache.size > 1000) {
          this.cleanupFallbackCache()
        }
      }
    } catch (error) {
      console.error('Cache set error:', error)
    }
  }

  /**
   * Delete value from cache
   * 
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      if (this.redis?.status === 'ready') {
        await this.redis.del(key)
      } else {
        this.fallbackCache.delete(key)
      }
    } catch (error) {
      console.error('Cache delete error:', error)
    }
  }

  /**
   * Check if key exists in cache
   * 
   * @param key - Cache key
   * @returns true if key exists and not expired
   */
  async has(key: string): Promise<boolean> {
    try {
      if (this.redis?.status === 'ready') {
        const exists = await this.redis.exists(key)
        return exists === 1
      } else {
        const cached = this.fallbackCache.get(key)
        if (cached) {
          if (cached.expiry > Date.now()) {
            return true
          } else {
            this.fallbackCache.delete(key)
            return false
          }
        }
        return false
      }
    } catch (error) {
      console.error('Cache has error:', error)
      return false
    }
  }

  /**
   * Clear all keys matching pattern
   * 
   * @param pattern - Redis key pattern (e.g., 'crossref:*')
   * 
   * @example
   * await cache.clear('crossref:*') // Clear all Crossref cached entries
   */
  async clear(pattern: string): Promise<void> {
    try {
      if (this.redis?.status === 'ready') {
        const keys = await this.redis.keys(pattern)
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      } else {
        // Clear matching keys from fallback cache
        // Escape special regex characters and convert glob pattern to regex
        const regexPattern = pattern
          .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape regex special chars
          .replace(/\*/g, '.*')  // Convert glob * to regex .*
        const regex = new RegExp(`^${regexPattern}$`)
        for (const key of this.fallbackCache.keys()) {
          if (regex.test(key)) {
            this.fallbackCache.delete(key)
          }
        }
      }
    } catch (error) {
      console.error('Cache clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      size: this.fallbackCache.size,
    }
  }

  /**
   * Reset cache statistics
   */
  resetStats(): void {
    this.stats = { hits: 0, misses: 0 }
  }

  /**
   * Clean up expired entries from fallback cache
   */
  private cleanupFallbackCache(): void {
    const now = Date.now()
    for (const [key, cached] of this.fallbackCache.entries()) {
      if (cached.expiry <= now) {
        this.fallbackCache.delete(key)
      }
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.redis = null
    }
    this.fallbackCache.clear()
  }

  /**
   * Check if Redis is connected
   */
  isConnected(): boolean {
    return this.redis?.status === 'ready'
  }
}

// Singleton instance for use across the application
export const redisCache = new RedisCache()
