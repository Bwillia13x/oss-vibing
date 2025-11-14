import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './insert-citations.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'
import Cite from 'citation-js'
import type { CSLItem, JsonDocument } from './types'

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
  let authors = []
  if (typeof citation.author === 'string') {
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

// Generate in-text citation
function generateInTextCitation(citation: Citation, style: string): string {
  try {
    const cslData = convertToCSL(citation)
    const cite = new Cite(cslData)
    
    const styleMap: Record<string, string> = {
      'APA': 'apa',
      'MLA': 'mla',
      'Chicago': 'chicago-note-bibliography',
    }
    
    // Generate citation
    const formatted = cite.format('citation', {
      format: 'text',
      template: styleMap[style] || 'apa',
      lang: 'en-US',
    })
    
    return formatted
  } catch (_error) {
    // Fallback to simple format
    const author = typeof citation.author === 'string' 
      ? citation.author.split(',')[0] 
      : citation.author[0]?.family || 'Unknown'
    const year = citation.year || 'n.d.'
    
    if (style === 'MLA') {
      return `(${author})`
    } else if (style === 'Chicago') {
      return `(${author} ${year})`
    } else {
      // APA default
      return `(${author}, ${year})`
    }
  }
}

export const insertCitations = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      docPath: z.string().describe('Path to the document'),
      citeKeys: z.array(z.string()).describe('Citation keys to insert (e.g., ["smith2024", "jones2023"])'),
      style: z.enum(['APA', 'MLA', 'Chicago']).default('APA').describe('Citation style'),
      location: z.string().optional().describe('Location hint for insertion (e.g., "after paragraph 2")'),
    }),
    execute: async ({ docPath, citeKeys, style, location }, { toolCallId }) => {
      const timestamp = new Date().toISOString()

      writer.write({
        id: toolCallId,
        type: 'data-uni-citations',
        data: {
          style,
          items: [],
          inserted: [],
          timestamp,
          status: 'inserting',
        },
      })

      try {
        // Read document
        const fullPath = path.join(process.cwd(), docPath)
        let docContent: JsonDocument
        
        try {
          const content = await fs.readFile(fullPath, 'utf-8')
          docContent = JSON.parse(content)
        } catch (_error) {
          throw new Error(`Could not read document: ${fullPath}`)
        }
        
        // Initialize citations array if not exists
        if (!docContent.citations) {
          docContent.citations = []
        }
        
        // Look for citations in references folder
        const referencesDir = path.join(process.cwd(), 'references')
        const allCitations: Citation[] = [...docContent.citations]
        
        // Try to load reference files
        try {
          const refFiles = await fs.readdir(referencesDir)
          for (const file of refFiles) {
            if (file.endsWith('.json')) {
              const refPath = path.join(referencesDir, file)
              const refContent = await fs.readFile(refPath, 'utf-8')
              const refData = JSON.parse(refContent)
              if (refData.sources && Array.isArray(refData.sources)) {
                allCitations.push(...refData.sources)
              }
            }
          }
        } catch (_error) {
          // References folder may not exist
        }
        
        // Find citations by keys
        const foundCitations: Citation[] = []
        const missingKeys: string[] = []
        
        for (const key of citeKeys) {
          const citation = allCitations.find(c => c.id === key || c.doi === key)
          if (citation) {
            foundCitations.push(citation)
            
            // Add to document citations if not already there
            const existsInDoc = docContent.citations.some((c: Citation) => c.id === citation.id)
            if (!existsInDoc) {
              docContent.citations.push(citation)
            }
          } else {
            missingKeys.push(key)
          }
        }
        
        // Generate in-text citations
        const inTextCitations = foundCitations.map(c => ({
          key: c.id,
          citation: generateInTextCitation(c, style),
          timestamp,
        }))
        
        // Add citation markers to document
        if (!docContent.citationMarkers) {
          docContent.citationMarkers = []
        }
        
        docContent.citationMarkers.push({
          location: location || 'end of document',
          citations: inTextCitations,
          insertedAt: timestamp,
        })
        
        // Update document metadata
        docContent.lastModified = timestamp
        
        // Save updated document
        await fs.writeFile(fullPath, JSON.stringify(docContent, null, 2))

        // Convert citations to expected format
        const formattedItems = foundCitations.map(c => ({
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
            inserted: citeKeys,
            timestamp,
            status: 'done',
          },
        })

        let message = `Inserted ${foundCitations.length} citations into ${docPath} using ${style} style.`
        if (missingKeys.length > 0) {
          message += ` Warning: ${missingKeys.length} citation(s) not found: ${missingKeys.join(', ')}`
        }
        
        return message
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
        
        return `Error inserting citations: ${errorMessage}`
      }
    },
  })
