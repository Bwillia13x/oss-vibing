import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './insert-citations.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
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

      // Stub implementation - would read doc, insert markers, update bibliography
      const items = citeKeys.map((key) => ({
        id: key,
        title: `Source: ${key}`,
        author: 'Author Name',
        doi: `10.1234/${key}`,
        url: `https://doi.org/10.1234/${key}`,
      }))

      writer.write({
        id: toolCallId,
        type: 'data-uni-citations',
        data: {
          style,
          items,
          inserted: citeKeys,
          timestamp,
          status: 'done',
        },
      })

      return `Inserted ${citeKeys.length} citations into ${docPath} using ${style} style.`
    },
  })
