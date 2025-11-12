import { NextResponse } from 'next/server'
import { getPerformanceReport } from '@/lib/performance'
import { apiCache, apiRateLimiter } from '@/lib/cache'

/**
 * Performance metrics API endpoint for monitoring
 * GET /api/metrics - Returns performance statistics
 */
export async function GET(req: Request) {
  // Rate limiting - use IP address
  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
  
  if (!apiRateLimiter.isAllowed(ip)) {
    const remaining = apiRateLimiter.remaining(ip)
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'Retry-After': '60'
        }
      }
    )
  }

  const report = getPerformanceReport()
  
  // Add cache statistics
  const cacheStats = {
    apiCache: apiCache.stats(),
  }
  
  return NextResponse.json({
    ...report,
    cache: cacheStats,
  })
}
