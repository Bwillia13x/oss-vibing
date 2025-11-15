import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './paraphrase-with-citation.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const paraphraseWithCitation = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      docPath: z.string().describe('Path to the document'),
      selectionId: z.string().describe('ID or location of text to paraphrase'),
      referenceId: z.string().describe('Citation key for the source'),
      style: z.enum(['APA', 'MLA', 'Chicago']).default('APA').describe('Citation style'),
    }),
    execute: async ({ docPath, selectionId: _selectionId, referenceId, style }, { toolCallId }) => {
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

      // Stub implementation - would paraphrase text and add citation
      const item = {
        id: referenceId,
        title: `Source for paraphrase: ${referenceId}`,
        author: 'Source Author',
        doi: `10.1234/${referenceId}`,
        url: `https://doi.org/10.1234/${referenceId}`,
      }

      writer.write({
        id: toolCallId,
        type: 'data-uni-citations',
        data: {
          style,
          items: [item],
          inserted: [referenceId],
          timestamp,
          status: 'done',
        },
      })

      return `Paraphrased selection in ${docPath} with citation to ${referenceId} (${style}). [WATERMARKED - requires acceptance]`
    },
  })
