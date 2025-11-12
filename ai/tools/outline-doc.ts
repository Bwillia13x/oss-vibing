import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './outline-doc.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const outlineDoc = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      topic: z.string().describe('The main topic or subject of the document'),
      level: z.string().describe('Academic level (high school, undergraduate, graduate)'),
      length: z.number().optional().describe('Target length in pages'),
      style: z.enum(['APA', 'MLA', 'Chicago']).optional().describe('Citation style'),
    }),
    execute: async ({ topic, level, length, style }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-outline',
        data: {
          topic,
          level,
          thesis: undefined,
          sectionHeads: [],
          status: 'generating',
        },
      })

      // Stub implementation - would generate actual outline
      const thesis = `This paper explores ${topic} and its implications.`
      const sectionHeads = [
        'Introduction',
        'Background and Context',
        'Main Analysis',
        'Discussion',
        'Conclusion',
      ]

      writer.write({
        id: toolCallId,
        type: 'data-uni-outline',
        data: {
          topic,
          level,
          thesis,
          sectionHeads,
          status: 'done',
        },
      })

      return `Created outline for "${topic}" with ${sectionHeads.length} main sections.`
    },
  })
