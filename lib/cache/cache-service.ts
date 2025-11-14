/**
 * Cache Service
 * 
 * High-level caching service that supports both Redis and in-memory fallback.
 * Provides unified interface for caching API responses, computed results, and more.
 */

import { getRedisClient, isRedisConnected } from './redis-client';

// In-memory fallback cache
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

// Default TTL values (in seconds)
export const DEFAULT_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 3600, // 1 hour
  DAY: 86400, // 24 hours
  WEEK: 604800, // 7 days
};

/**
 * Get value from cache
 */
export async function getCached<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        const value = await redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
        }
      }
    }

    // Fallback to memory cache
    const entry = memoryCache.get(key);
    if (entry) {
      if (Date.now() < entry.expiresAt) {
        return entry.value as T;
      } else {
        // Expired, remove from cache
        memoryCache.delete(key);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error getting cached value for key ${key}:`, error);
    return null;
  }
}

/**
 * Set value in cache with TTL
 */
export async function setCached<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL.MEDIUM
): Promise<void> {
  try {
    const serialized = JSON.stringify(value);

    // Try Redis first
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        await redis.setex(key, ttlSeconds, serialized);
        return;
      }
    }

    // Fallback to memory cache
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  } catch (error) {
    console.error(`Error setting cached value for key ${key}:`, error);
  }
}

/**
 * Delete value from cache
 */
export async function deleteCached(key: string): Promise<void> {
  try {
    // Try Redis first
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        await redis.del(key);
      }
    }

    // Also remove from memory cache
    memoryCache.delete(key);
  } catch (error) {
    console.error(`Error deleting cached value for key ${key}:`, error);
  }
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachedPattern(pattern: string): Promise<void> {
  try {
    // Try Redis first
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        // Use SCAN instead of KEYS for non-blocking iteration
        let cursor = '0';
        do {
          const [newCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = newCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      }
    }

    // Fallback: clear matching keys from memory cache
    // Escape special regex characters, then replace * with .*
    const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('^' + escapedPattern.replace(/\*/g, '.*') + '$');
    for (const key of memoryCache.keys()) {
      if (regex.test(key)) {
        memoryCache.delete(key);
      }
    }
  } catch (error) {
    console.error(`Error deleting cached pattern ${pattern}:`, error);
  }
}

/**
 * Clear all cache entries
 */
export async function clearCache(): Promise<void> {
  try {
    // Try Redis first - use SCAN instead of flushdb to be safer
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        let cursor = '0';
        do {
          const [newCursor, keys] = await redis.scan(cursor, 'COUNT', 100);
          cursor = newCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      }
    }

    // Also clear memory cache
    memoryCache.clear();
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Get or set cached value (cache-aside pattern)
 */
export async function getOrSetCached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL.MEDIUM
): Promise<T> {
  // Try to get from cache first
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Not in cache, fetch the value
  const value = await fetchFn();

  // Store in cache
  await setCached(key, value, ttlSeconds);

  return value;
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  redis: {
    connected: boolean;
    keys?: number;
    memory?: string;
  };
  memory: {
    size: number;
  };
}> {
  const stats = {
    redis: {
      connected: isRedisConnected(),
    } as { connected: boolean; keys?: number; memory?: string },
    memory: {
      size: memoryCache.size,
    },
  };

  try {
    if (isRedisConnected()) {
      const redis = getRedisClient();
      if (redis) {
        const dbsize = await redis.dbsize();
        const info = await redis.info('memory');
        const memoryMatch = info.match(/used_memory_human:(.+)/);

        stats.redis.keys = dbsize;
        stats.redis.memory = memoryMatch ? memoryMatch[1].trim() : 'unknown';
      }
    }
  } catch (error) {
    console.error('Error getting cache stats:', error);
  }

  return stats;
}

/**
 * Generate cache key from components
 */
export function generateCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

/**
 * Clean up expired entries from memory cache
 * Should be called periodically
 */
export function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, entry] of memoryCache.entries()) {
    if (now >= entry.expiresAt) {
      memoryCache.delete(key);
    }
  }
}

// Memory cache cleanup interval management
let cleanupInterval: NodeJS.Timeout | null = null;

/**
 * Start periodic memory cache cleanup.
 * Only starts if not already running.
 */
export function startMemoryCacheCleanup(): void {
  if (cleanupInterval) return; // Already running
  if (typeof setInterval !== 'undefined') {
    cleanupInterval = setInterval(cleanupMemoryCache, 5 * 60 * 1000);
  }
}

/**
 * Stop periodic memory cache cleanup.
 */
export function stopMemoryCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Auto-start cleanup in server environments
if (typeof setInterval !== 'undefined' && !cleanupInterval) {
  startMemoryCacheCleanup();
}
