/**
 * Cache Module
 * 
 * Exports cache functionality including Redis client and cache service
 */

export {
  getRedisClient,
  isRedisConnected,
  closeRedisConnection,
  pingRedis,
} from './redis-client';

export {
  getCached,
  setCached,
  deleteCached,
  deleteCachedPattern,
  clearCache,
  getOrSetCached,
  getCacheStats,
  generateCacheKey,
  cleanupMemoryCache,
  startMemoryCacheCleanup,
  stopMemoryCacheCleanup,
  DEFAULT_TTL,
} from './cache-service';
