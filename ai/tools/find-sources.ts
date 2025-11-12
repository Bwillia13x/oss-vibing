import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './find-sources.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'

// Configuration constants
const DEFAULT_SEARCH_LIMIT = 10 // Default number of results per API provider
const MAX_TOTAL_RESULTS = 20 // Maximum total results to return

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface CrossrefWork {
  DOI?: string
  title?: string[]
  author?: Array<{ given?: string; family?: string }>
  'container-title'?: string[]
  published?: { 'date-parts'?: number[][] }
  'published-print'?: { 'date-parts'?: number[][] }
  volume?: string
  issue?: string
  page?: string
  URL?: string
  type?: string
}

interface CrossrefResponse {
  message?: {
    items?: CrossrefWork[]
    'total-results'?: number
  }
}

// OpenAlex interfaces
interface OpenAlexWork {
  id?: string
  doi?: string
  title?: string
  authorships?: Array<{
    author?: {
      display_name?: string
    }
  }>
  primary_location?: {
    source?: {
      display_name?: string
    }
  }
  publication_year?: number
  biblio?: {
    volume?: string
    issue?: string
    first_page?: string
    last_page?: string
  }
  type?: string
}

interface OpenAlexResponse {
  results?: OpenAlexWork[]
  meta?: {
    count?: number
  }
}

// Semantic Scholar interfaces
interface SemanticScholarPaper {
  paperId?: string
  externalIds?: {
    DOI?: string
  }
  title?: string
  authors?: Array<{
    name?: string
  }>
  venue?: string
  year?: number
  citationCount?: number
  url?: string
}

interface SemanticScholarResponse {
  data?: SemanticScholarPaper[]
  total?: number
}

// Unified citation interface
interface UnifiedCitation {
  id: string
  doi?: string
  title: string
  author: string
  year?: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  url?: string
  type?: string
  citationCount?: number
  source: 'Crossref' | 'OpenAlex' | 'SemanticScholar'
}

// Search Crossref API
async function searchCrossref(query: string, yearRange?: { start: number; end: number }, limit = 10) {
  try {
    const baseUrl = 'https://api.crossref.org/works'
    const params = new URLSearchParams({
      query: query,
      rows: limit.toString(),
      select: 'DOI,title,author,container-title,published,volume,issue,page,URL,type',
    })
    
    if (yearRange) {
      params.append('filter', `from-pub-date:${yearRange.start},until-pub-date:${yearRange.end}`)
    }
    
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'VibeUniversity/0.1.0 (mailto:support@vibeuniversity.edu)',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Crossref API error: ${response.statusText}`)
    }
    
    const data: CrossrefResponse = await response.json()
    return data.message?.items || []
  } catch (error) {
    console.error('Error searching Crossref:', error)
    return []
  }
}

// Format author names
function formatAuthors(authors?: Array<{ given?: string; family?: string }>): string {
  if (!authors || authors.length === 0) return 'Unknown Author'
  
  if (authors.length === 1) {
    const author = authors[0]
    return `${author.family || ''}, ${author.given || ''}`.trim()
  }
  
  if (authors.length === 2) {
    return `${authors[0].family || ''}, ${authors[0].given || ''} & ${authors[1].family || ''}, ${authors[1].given || ''}`.trim()
  }
  
  const firstAuthor = authors[0]
  return `${firstAuthor.family || ''}, ${firstAuthor.given || ''} et al.`.trim()
}

// Extract year from date parts
function extractYear(work: CrossrefWork): number | undefined {
  const published = work.published || work['published-print']
  const dateParts = published?.['date-parts']?.[0]
  return dateParts?.[0]
}

// Search OpenAlex API
async function searchOpenAlex(query: string, yearRange?: { start: number; end: number }, limit = 10): Promise<UnifiedCitation[]> {
  try {
    const baseUrl = 'https://api.openalex.org/works'
    const params = new URLSearchParams({
      search: query,
      per_page: limit.toString(),
    })
    
    if (yearRange) {
      params.append('filter', `publication_year:${yearRange.start}-${yearRange.end}`)
    }
    
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'VibeUniversity/0.1.0 (mailto:support@vibeuniversity.edu)',
      },
    })
    
    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.statusText}`)
    }
    
    const data: OpenAlexResponse = await response.json()
    return (data.results || []).map((work, index) => convertOpenAlexToCitation(work, index))
  } catch (error) {
    console.error('Error searching OpenAlex:', error)
    return []
  }
}

// Search Semantic Scholar API
async function searchSemanticScholar(query: string, yearRange?: { start: number; end: number }, limit = 10): Promise<UnifiedCitation[]> {
  try {
    const baseUrl = 'https://api.semanticscholar.org/graph/v1/paper/search'
    const params = new URLSearchParams({
      query: query,
      limit: limit.toString(),
      fields: 'paperId,externalIds,title,authors,venue,year,citationCount,url',
    })
    
    if (yearRange) {
      params.append('year', `${yearRange.start}-${yearRange.end}`)
    }
    
    const response = await fetch(`${baseUrl}?${params.toString()}`, {
      headers: {
        'User-Agent': 'VibeUniversity/0.1.0 (mailto:support@vibeuniversity.edu)',
      },
    })
    
    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.statusText}`)
    }
    
    const data: SemanticScholarResponse = await response.json()
    return (data.data || []).map((paper, index) => convertSemanticScholarToCitation(paper, index))
  } catch (error) {
    console.error('Error searching Semantic Scholar:', error)
    return []
  }
}

// Convert Crossref work to unified citation
function convertToCitation(work: CrossrefWork, index: number): UnifiedCitation {
  const year = extractYear(work)
  const authors = formatAuthors(work.author)
  const title = work.title?.[0] || 'Untitled'
  const container = work['container-title']?.[0]
  
  return {
    id: work.DOI || `crossref-${index + 1}`,
    doi: work.DOI,
    title,
    author: authors,
    year,
    journal: container,
    volume: work.volume,
    issue: work.issue,
    pages: work.page,
    url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : undefined),
    type: work.type,
    source: 'Crossref',
  }
}

// Convert OpenAlex work to unified citation
function convertOpenAlexToCitation(work: OpenAlexWork, index: number): UnifiedCitation {
  const authors = work.authorships?.map(a => a.author?.display_name).filter(Boolean).join(', ') || 'Unknown Author'
  const pages = work.biblio?.first_page && work.biblio?.last_page 
    ? `${work.biblio.first_page}-${work.biblio.last_page}`
    : work.biblio?.first_page
  
  return {
    id: work.doi || work.id || `openalex-${index + 1}`,
    doi: work.doi,
    title: work.title || 'Untitled',
    author: authors,
    year: work.publication_year,
    journal: work.primary_location?.source?.display_name,
    volume: work.biblio?.volume,
    issue: work.biblio?.issue,
    pages,
    url: work.doi ? `https://doi.org/${work.doi}` : work.id,
    type: work.type,
    source: 'OpenAlex',
  }
}

// Convert Semantic Scholar paper to unified citation
function convertSemanticScholarToCitation(paper: SemanticScholarPaper, index: number): UnifiedCitation {
  const authors = paper.authors?.map(a => a.name).filter(Boolean).join(', ') || 'Unknown Author'
  const doi = paper.externalIds?.DOI
  
  return {
    id: doi || paper.paperId || `semanticscholar-${index + 1}`,
    doi,
    title: paper.title || 'Untitled',
    author: authors,
    year: paper.year,
    journal: paper.venue,
    url: doi ? `https://doi.org/${doi}` : paper.url,
    citationCount: paper.citationCount,
    source: 'SemanticScholar',
  }
}

export const findSources = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      query: z.string().describe('Search query for academic sources'),
      yearRange: z.object({
        start: z.number(),
        end: z.number(),
      }).optional().describe('Optional year range for publications'),
      mustInclude: z.array(z.string()).optional().describe('Keywords that must be included'),
      exclude: z.array(z.string()).optional().describe('Keywords to exclude'),
      style: z.enum(['APA', 'MLA', 'Chicago']).default('APA').describe('Citation style'),
      provider: z.enum(['Crossref', 'OpenAlex', 'SemanticScholar', 'All']).default('All').describe('API provider to use'),
    }),
    execute: async ({ query, yearRange, mustInclude, exclude, style, provider }, { toolCallId }) => {
      const timestamp = new Date().toISOString()

      writer.write({
        id: toolCallId,
        type: 'data-uni-citations',
        data: {
          style,
          items: [],
          inserted: [],
          timestamp,
          status: 'searching',
        },
      })

      try {
        // Build search query with filters
        let searchQuery = query
        if (mustInclude && mustInclude.length > 0) {
          searchQuery += ' ' + mustInclude.join(' ')
        }
        
        // Search across APIs with failover
        let allSources: UnifiedCitation[] = []
        const searchLimit = DEFAULT_SEARCH_LIMIT
        
        if (provider === 'All' || provider === 'Crossref') {
          try {
            const crossrefWorks = await searchCrossref(searchQuery, yearRange, searchLimit)
            const crossrefSources = crossrefWorks.map(convertToCitation)
            allSources.push(...crossrefSources)
          } catch (error) {
            console.error('Crossref failed, trying other providers:', error)
          }
        }
        
        if (provider === 'All' || provider === 'OpenAlex') {
          try {
            const openAlexSources = await searchOpenAlex(searchQuery, yearRange, searchLimit)
            allSources.push(...openAlexSources)
          } catch (error) {
            console.error('OpenAlex failed, trying other providers:', error)
          }
        }
        
        if (provider === 'All' || provider === 'SemanticScholar') {
          try {
            const semanticScholarSources = await searchSemanticScholar(searchQuery, yearRange, searchLimit)
            allSources.push(...semanticScholarSources)
          } catch (error) {
            console.error('Semantic Scholar failed:', error)
          }
        }
        
        // Deduplicate by DOI
        const uniqueSources = new Map<string, UnifiedCitation>()
        for (const source of allSources) {
          const key = source.doi || source.id
          if (!uniqueSources.has(key)) {
            uniqueSources.set(key, source)
          }
        }
        
        let sources = Array.from(uniqueSources.values())
        
        // Filter out excluded terms
        if (exclude && exclude.length > 0) {
          sources = sources.filter(source => {
            const sourceText = source.title + ' ' + (source.journal || '')
            return !exclude.some(term => sourceText.toLowerCase().includes(term.toLowerCase()))
          })
        }
        
        // Sort by citation count (if available) or year
        sources.sort((a, b) => {
          if (a.citationCount && b.citationCount) {
            return b.citationCount - a.citationCount
          }
          if (a.year && b.year) {
            return b.year - a.year
          }
          return 0
        })
        
        // Limit to top results
        sources = sources.slice(0, MAX_TOTAL_RESULTS)
        
        // Save to references folder
        try {
          const referencesDir = path.join(process.cwd(), 'references')
          await fs.mkdir(referencesDir, { recursive: true })
          
          const filename = `search-${Date.now()}.json`
          const filepath = path.join(referencesDir, filename)
          
          await fs.writeFile(filepath, JSON.stringify({
            query,
            yearRange,
            style,
            timestamp,
            sources,
            provenance: {
              apis: provider === 'All' ? ['Crossref', 'OpenAlex', 'SemanticScholar'] : [provider],
              fetchedAt: timestamp,
              totalResults: sources.length,
              deduplicated: true,
            },
          }, null, 2))
        } catch (error) {
          console.error('Error saving references:', error)
        }

        writer.write({
          id: toolCallId,
          type: 'data-uni-citations',
          data: {
            style,
            items: sources,
            inserted: [],
            timestamp,
            status: 'done',
          },
        })

        const providerInfo = provider === 'All' 
          ? 'multiple APIs (Crossref, OpenAlex, Semantic Scholar)'
          : provider
        return `Found ${sources.length} unique academic sources for "${query}" using ${providerInfo}. Results deduplicated and staged in references/ folder with full provenance tracking.`
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        writer.write({
          id: toolCallId,
          type: 'data-uni-citations',
          data: {
            style,
            items: [],
            inserted: [],
            timestamp,
            status: 'error',
            error: { message: errorMessage },
          },
        })
        
        return `Error searching for sources: ${errorMessage}`
      }
    },
  })
