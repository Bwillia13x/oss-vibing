import { NextResponse } from 'next/server'
import { getPerformanceReport } from '@/lib/performance'
import { apiCache } from '@/lib/cache'

/**
 * Performance metrics API endpoint for monitoring
 * GET /api/metrics - Returns performance statistics
 */
export async function GET() {
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
