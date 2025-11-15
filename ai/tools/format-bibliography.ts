import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './format-bibliography.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { CSLItem, JsonDocument } from './types'
import Cite from 'citation-js'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface Citation {
  id: string
  doi?: string
  title: string
  author: string | Array<{ given?: string; family?: string }>
  year?: number
  journal?: string
  volume?: string
  issue?: string
  pages?: string
  url?: string
  type?: string
}

// Convert citation to CSL JSON format
function convertToCSL(citation: Citation) {
  // Parse author if string
  let authors = []
  if (typeof citation.author === 'string') {
    // Simple parsing for "Last, First" or "Last, First & Last, First" format
    const authorParts = citation.author.split(' & ')
    authors = authorParts.map(authorStr => {
      const parts = authorStr.split(',').map(s => s.trim())
      if (parts.length >= 2) {
        return { family: parts[0], given: parts[1] }
      }
      return { literal: authorStr }
    })
  } else {
    authors = citation.author
  }
  
  const cslItem: CSLItem = {
    id: citation.id,
    type: citation.type || 'article-journal',
    title: citation.title,
    author: authors,
  }
  
  if (citation.doi) cslItem.DOI = citation.doi
  if (citation.year) cslItem.issued = { 'date-parts': [[citation.year]] }
  if (citation.journal) cslItem['container-title'] = citation.journal
  if (citation.volume) cslItem.volume = citation.volume
  if (citation.issue) cslItem.issue = citation.issue
  if (citation.pages) cslItem.page = citation.pages
  if (citation.url) cslItem.URL = citation.url
  
  return cslItem
}

export const formatBibliography = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      docPath: z.string().describe('Path to the document'),
      style: z.enum(['APA', 'MLA', 'Chicago']).default('APA').describe('Citation style'),
    }),
    execute: async ({ docPath, style }, { toolCallId }) => {
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
        // Read document to extract citations
        const fullPath = path.join(process.cwd(), docPath)
        let docContent: JsonDocument
        
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          docContent = JSON.parse(content)
        } catch (_error) {
          throw new Error(`Could not read document: ${fullPath}`)
        }
        
        // Gather citations from document
        const citations: Citation[] = Array.isArray(docContent.citations) ? docContent.citations as Citation[] : []
        
        if (citations.length === 0) {
          writer.write({
            id: toolCallId,
            type: 'data-uni-citations',
            data: {
              style,
              items: [],
              inserted: [],
              timestamp,
              status: 'done',
            },
          })
          
          return `No citations found in ${docPath}.`
        }
        
        // Convert to CSL JSON format
        const cslData = citations.map(convertToCSL)
        
        // Map style names to citation-js style identifiers
        const styleMap: Record<string, string> = {
          'APA': 'apa',
          'MLA': 'mla',
          'Chicago': 'chicago-note-bibliography',
        }
        
        // Create citation instance
        const cite = new Cite(cslData)
        
        // Format bibliography
        const bibliography = cite.format('bibliography', {
          format: 'text',
          template: styleMap[style] || 'apa',
          lang: 'en-US',
        })
        
        // Update document with formatted bibliography
        docContent.bibliography = {
          style,
          formatted: bibliography,
          updatedAt: timestamp,
          citationCount: citations.length,
        }
        
        // Save updated document
        await fs.writeFile(fullPath, JSON.stringify(docContent, null, 2))

        // Convert citations to expected format
        const formattedItems = citations.map(c => ({
          id: c.id,
          title: c.title,
          author: typeof c.author === 'string' ? c.author : c.author.map(a => `${a.family}, ${a.given}`).join(' & '),
          doi: c.doi,
          url: c.url,
        }))

        writer.write({
          id: toolCallId,
          type: 'data-uni-citations',
          data: {
            style,
            items: formattedItems,
            inserted: citations.map((c) => c.id),
            timestamp,
            status: 'done',
          },
        })

        return `Formatted bibliography for ${docPath} with ${citations.length} sources in ${style} style. Bibliography section updated in document.`
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
        
        return `Error formatting bibliography: ${errorMessage}`
      }
    },
  })
