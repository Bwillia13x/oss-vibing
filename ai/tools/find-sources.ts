import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './find-sources.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'

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

// Convert Crossref work to citation item
function convertToCitation(work: CrossrefWork, index: number) {
  const year = extractYear(work)
  const authors = formatAuthors(work.author)
  const title = work.title?.[0] || 'Untitled'
  const container = work['container-title']?.[0]
  
  return {
    id: work.DOI || `source${index + 1}`,
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
    }),
    execute: async ({ query, yearRange, mustInclude, exclude, style }, { toolCallId }) => {
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
        
        // Search Crossref
        const works = await searchCrossref(searchQuery, yearRange, 20)
        
        // Filter out excluded terms
        let filteredWorks = works
        if (exclude && exclude.length > 0) {
          filteredWorks = works.filter(work => {
            const workText = (work.title?.[0] || '') + ' ' + (work['container-title']?.[0] || '')
            return !exclude.some(term => workText.toLowerCase().includes(term.toLowerCase()))
          })
        }
        
        // Convert to citation format
        const sources = filteredWorks.slice(0, 15).map(convertToCitation)
        
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
              api: 'Crossref',
              fetchedAt: timestamp,
              totalResults: sources.length,
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

        return `Found ${sources.length} academic sources for "${query}" using Crossref API. Results staged in references/ folder with provenance tracking.`
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
