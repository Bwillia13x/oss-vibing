import { NextRequest, NextResponse } from 'next/server'
import { fileIndexer, initializeFileIndex, searchArtifacts } from '@/lib/file-indexer'
import { perfMonitor } from '@/lib/performance'
import { apiCache } from '@/lib/cache'

/**
 * File management API for Phase 3.4.1 Database Optimization
 * GET /api/files - Get file statistics
 * GET /api/files?search=query - Search files
 * GET /api/files?type=document - Filter by type
 */
export async function GET(req: NextRequest) {
  return perfMonitor.time('api.files', async () => {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type') as any

    // Initialize index if empty (first request)
    const stats = fileIndexer.getStats()
    if (stats.totalFiles === 0) {
      await initializeFileIndex()
    }

    // Handle search queries
    if (search) {
      const results = searchArtifacts(search, type)
      return NextResponse.json({
        query: search,
        type: type || 'all',
        count: results.length,
        results: results.slice(0, 50), // Limit to 50 results
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
export async function POST() {
  return perfMonitor.time('api.files.rebuild', async () => {
    await initializeFileIndex()
    
    // Clear cache
    apiCache.delete('file_stats')
    
    return NextResponse.json({
      success: true,
      stats: fileIndexer.getStats(),
    })
  })
}
