import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './find-sources.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
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

      // Stub implementation - would call actual APIs
      const mockSources = [
        {
          id: 'source1',
          title: `Academic Research on ${query}`,
          author: 'Smith, J. & Johnson, A.',
          doi: '10.1234/example.2024',
          url: 'https://example.org/article',
        },
        {
          id: 'source2',
          title: `Advances in ${query} Studies`,
          author: 'Williams, B.',
          doi: '10.5678/example.2023',
          url: 'https://example.org/article2',
        },
      ]

      writer.write({
        id: toolCallId,
        type: 'data-uni-citations',
        data: {
          style,
          items: mockSources,
          inserted: [],
          timestamp,
          status: 'done',
        },
      })

      return `Found ${mockSources.length} sources for "${query}". Staged in references/ folder.`
    },
  })
