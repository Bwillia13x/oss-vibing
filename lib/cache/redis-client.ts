/**
 * Redis Client Singleton
 * 
 * Provides a singleton instance of Redis client with connection management,
 * error handling, and graceful degradation when Redis is unavailable.
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;
let isRedisAvailable = false;

/**
 * Get or create Redis client instance
 * Falls back gracefully if Redis is not available
 */
export function getRedisClient(): Redis | null {
  // Return existing client if available
  if (redisClient) {
    return redisClient;
  }

  // Check if Redis is configured
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    console.warn('REDIS_URL not configured, running without Redis cache');
    return null;
  }

  try {
    // Create new Redis client
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Graceful shutdown
      lazyConnect: true,
      enableOfflineQueue: true,
    });

    // Handle connection events
    redisClient.on('connect', () => {
      console.log('Redis client connected');
      isRedisAvailable = true;
    });

    redisClient.on('error', (error) => {
      console.error('Redis client error:', error.message);
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      console.log('Redis connection closed');
      isRedisAvailable = false;
    });

    // Attempt to connect
    redisClient.connect().catch((error) => {
      console.error('Failed to connect to Redis:', error.message);
      isRedisAvailable = false;
    });

    return redisClient;
  } catch (error) {
    console.error('Error creating Redis client:', error);
    return null;
  }
}

/**
 * Check if Redis is available and connected
 */
export function isRedisConnected(): boolean {
  return isRedisAvailable && redisClient !== null && redisClient.status === 'ready';
}

/**
 * Close Redis connection
 * Should be called during application shutdown
 */
export async function closeRedisConnection(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    isRedisAvailable = false;
  }
}

/**
 * Ping Redis to check connection
 */
export async function pingRedis(): Promise<boolean> {
  try {
    if (!redisClient) return false;
    const result = await redisClient.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}
