import { NextRequest, NextResponse } from 'next/server'
import { fileIndexer, initializeFileIndex, searchArtifacts, FileMetadata } from '@/lib/file-indexer'
import { perfMonitor } from '@/lib/performance'
import { apiCache, apiRateLimiter } from '@/lib/cache'

// Prevent concurrent initializations
let initializing = false

/**
 * File management API for Phase 3.4.1 Database Optimization
 * GET /api/files - Get file statistics
 * GET /api/files?search=query - Search files
 * GET /api/files?type=document - Filter by type
 */
export async function GET(req: NextRequest) {
  return perfMonitor.time('api.files', async () => {
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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const typeParam = searchParams.get('type')
    
    // Validate type parameter
    const validTypes = ['document', 'sheet', 'deck', 'note', 'reference', 'quiz', 'course', 'other']
    if (typeParam && !validTypes.includes(typeParam)) {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 })
    }

    // Initialize index if empty (first request)
    const stats = fileIndexer.getStats()
    if (stats.totalFiles === 0 && !initializing) {
      initializing = true
      try {
        await initializeFileIndex()
      } finally {
        initializing = false
      }
    }

    // Handle search queries
    if (search) {
      // Validate search parameter
      if (search.length < 2) {
        return NextResponse.json({ error: 'Search query must be at least 2 characters' }, { status: 400 })
      }
      if (search.length > 100) {
        return NextResponse.json({ error: 'Search query too long' }, { status: 400 })
      }
      
      const results = searchArtifacts(search, typeParam as FileMetadata['type'] | undefined)
      return NextResponse.json({
        query: search,
        type: typeParam || 'all',
        count: results.length,
        results: results.slice(0, 50), // Limit to 50 results
        hasMore: results.length > 50,
        totalCount: results.length,
      })
    }

    // Return statistics
    const cacheKey = 'file_stats'
    const cached = apiCache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    const result = {
      stats: fileIndexer.getStats(),
      types: ['document', 'sheet', 'deck', 'note', 'reference', 'quiz', 'course'],
    }

    // Cache for 30 seconds
    apiCache.set(cacheKey, result)

    return NextResponse.json(result)
  })
}

/**
 * Rebuild file index (POST to refresh)
 */
export async function POST(req: Request) {
  return perfMonitor.time('api.files.rebuild', async () => {
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

    await initializeFileIndex()
    
    // Clear cache
    apiCache.delete('file_stats')
    
    return NextResponse.json({
      success: true,
      stats: fileIndexer.getStats(),
    })
  })
}
