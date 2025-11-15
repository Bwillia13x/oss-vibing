/**
 * Unified Citation Search API - Phase 13
 * 
 * Provides a unified interface to search across multiple
 * academic citation APIs (Crossref, OpenAlex, Semantic Scholar)
 * with caching and deduplication.
 * 
 * @route GET /api/citations/search
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  cachedCrossrefSearch,
  cachedOpenAlexSearch,
  cachedSemanticScholarSearch,
} from '@/lib/cache/api-cache'

/**
 * Unified citation result
 */
interface UnifiedCitation {
  id: string
  doi?: string
  title: string
  authors: string[]
  year?: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  url?: string
  citationCount?: number
  isOpenAccess?: boolean
  openAccessUrl?: string
  abstract?: string
  source: 'Crossref' | 'OpenAlex' | 'SemanticScholar'
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const provider = searchParams.get('provider') || 'all'
    const yearStart = searchParams.get('yearStart')
    const yearEnd = searchParams.get('yearEnd')
    const openAccessOnly = searchParams.get('openAccessOnly') === 'true'

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      )
    }

    const yearRange =
      yearStart && yearEnd
        ? { start: parseInt(yearStart, 10), end: parseInt(yearEnd, 10) }
        : undefined

    // Search across all providers
    const results: UnifiedCitation[] = []

    // Crossref
    if (provider === 'all' || provider === 'crossref') {
      try {
        const crossrefWorks = await cachedCrossrefSearch(query, limit)
        const crossrefResults = crossrefWorks
          .filter(work => {
            if (!yearRange) return true
            const year = work['published-print']?.['date-parts']?.[0]?.[0]
            return year && year >= yearRange.start && year <= yearRange.end
          })
          .map(work => ({
            id: work.DOI || `crossref-${work.title?.[0]}`,
            doi: work.DOI,
            title: work.title?.[0] || '',
            authors:
              work.author?.map(a => `${a.given || ''} ${a.family}`.trim()) || [],
            year: work['published-print']?.['date-parts']?.[0]?.[0],
            journal: work['container-title']?.[0],
            volume: work.volume,
            issue: work.issue,
            pages: work.page,
            url: work.DOI ? `https://doi.org/${work.DOI}` : work.URL,
            source: 'Crossref' as const,
          }))
        results.push(...crossrefResults)
      } catch (error) {
        console.error('Crossref search failed:', error)
      }
    }

    // OpenAlex
    if (provider === 'all' || provider === 'openalex') {
      try {
        const openAlexWorks = await cachedOpenAlexSearch(query, {
          limit,
          yearRange,
          openAccessOnly,
        })
        const openAlexResults = openAlexWorks.map(work => ({
          id: work.doi || work.id,
          doi: work.doi,
          title: work.title,
          authors:
            work.authorships?.map(a => a.author.display_name) || [],
          year: work.publication_year,
          journal: work.primary_location?.source?.display_name,
          volume: work.biblio?.volume,
          issue: work.biblio?.issue,
          pages:
            work.biblio?.first_page && work.biblio?.last_page
              ? `${work.biblio.first_page}-${work.biblio.last_page}`
              : work.biblio?.first_page,
          url: work.doi ? `https://doi.org/${work.doi}` : work.id,
          citationCount: work.cited_by_count,
          isOpenAccess: work.open_access?.is_oa,
          openAccessUrl: work.open_access?.oa_url,
          source: 'OpenAlex' as const,
        }))
        results.push(...openAlexResults)
      } catch (error) {
        console.error('OpenAlex search failed:', error)
      }
    }

    // Semantic Scholar
    if (provider === 'all' || provider === 'semanticscholar') {
      try {
        const semanticPapers = await cachedSemanticScholarSearch(query, {
          limit,
          yearRange,
        })
        const semanticResults = semanticPapers.map(paper => ({
          id: paper.externalIds?.DOI || paper.paperId,
          doi: paper.externalIds?.DOI,
          title: paper.title,
          authors: paper.authors?.map(a => a.name) || [],
          year: paper.year,
          journal: paper.venue,
          url: paper.externalIds?.DOI
            ? `https://doi.org/${paper.externalIds.DOI}`
            : paper.url,
          citationCount: paper.citationCount,
          isOpenAccess: paper.isOpenAccess,
          openAccessUrl: paper.openAccessPdf?.url,
          abstract: paper.abstract,
          source: 'SemanticScholar' as const,
        }))
        results.push(...semanticResults)
      } catch (error) {
        console.error('Semantic Scholar search failed:', error)
      }
    }

    // Deduplicate by DOI
    const uniqueResults = new Map<string, UnifiedCitation>()
    for (const result of results) {
      const key = result.doi || result.id
      if (!uniqueResults.has(key)) {
        uniqueResults.set(key, result)
      }
    }

    const dedupedResults = Array.from(uniqueResults.values())

    // Sort by citation count (if available) or year
    dedupedResults.sort((a, b) => {
      if (a.citationCount !== undefined && b.citationCount !== undefined) {
        return b.citationCount - a.citationCount
      }
      if (a.year && b.year) {
        return b.year - a.year
      }
      return 0
    })

    // Limit results
    const limitedResults = dedupedResults.slice(0, limit)

    return NextResponse.json({
      query,
      total: limitedResults.length,
      providers:
        provider === 'all'
          ? ['Crossref', 'OpenAlex', 'SemanticScholar']
          : [provider],
      results: limitedResults,
      cached: true, // Results are cached
    })
  } catch (error) {
    console.error('Citation search error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return NextResponse.json(
      {
        error: 'Failed to search citations',
        message: errorMessage,
      },
      { status: 500 }
    )
  }
}
