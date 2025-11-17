/**
 * Cache Health Check API Endpoint
 * 
 * Provides real-time status of Redis cache and performance metrics
 * Useful for monitoring and debugging cache performance
 */

import { NextResponse } from 'next/server';
import { isRedisConnected, pingRedis } from '@/lib/cache/redis-client';
import { getCacheStats } from '@/lib/cache/cache-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const connected = isRedisConnected();
    const pingResult = await pingRedis();
    const stats = await getCacheStats();

    // Calculate hit rate
    const totalRequests = stats.memoryHits + stats.memoryMisses;
    const hitRate = totalRequests > 0 
      ? ((stats.memoryHits / totalRequests) * 100).toFixed(2)
      : '0.00';

    return NextResponse.json({
      status: connected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      redis: {
        connected,
        ping: pingResult ? 'PONG' : 'TIMEOUT',
        mode: connected ? 'redis' : 'memory-fallback',
      },
      cache: {
        hits: stats.memoryHits,
        misses: stats.memoryMisses,
        hitRate: `${hitRate}%`,
        totalKeys: stats.memory.size || 0,
      },
      performance: {
        target: {
          hitRate: '> 70%',
          responseTime: '< 200ms (p95)',
        },
        actual: {
          hitRate: `${hitRate}%`,
          hitRateOk: parseFloat(hitRate) > 70,
        },
      },
    });
  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      redis: {
        connected: false,
        mode: 'memory-fallback',
      },
    }, { status: 500 });
  }
}
