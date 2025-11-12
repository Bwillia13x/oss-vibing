import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './format-bibliography.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
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

      // Stub implementation - would gather citations and format bibliography
      const items = [
        {
          id: 'jones2023',
          title: 'Sustainable Agriculture in a Changing Climate',
          author: 'Jones, M. & Williams, R.',
          doi: '10.1234/sustag.2023',
          url: 'https://doi.org/10.1234/sustag.2023',
        },
        {
          id: 'smith2024',
          title: 'Climate Change Impacts on Global Agriculture',
          author: 'Smith, J. & Johnson, A.',
          doi: '10.1234/jes.2024.45.234',
          url: 'https://doi.org/10.1234/jes.2024.45.234',
        },
      ]

      writer.write({
        id: toolCallId,
        type: 'data-uni-citations',
        data: {
          style,
          items,
          inserted: items.map((i) => i.id),
          timestamp,
          status: 'done',
        },
      })

      return `Formatted bibliography for ${docPath} with ${items.length} sources in ${style} style.`
    },
  })
