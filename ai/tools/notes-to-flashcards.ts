import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './notes-to-flashcards.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const notesToFlashcards = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      notePath: z.string().describe('Path to notes file'),
      policy: z.enum(['cloze', 'qa', 'term']).default('qa').describe('Type of flashcards to generate'),
      count: z.number().optional().describe('Maximum number of cards to generate'),
    }),
    execute: async ({ notePath, policy, count }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-flashcards',
        data: {
          count: 0,
          cards: [],
          scheduleMeta: undefined,
          status: 'generating',
        },
      })

      // Stub implementation - would generate actual flashcards
      const cards = [
        { front: 'What is photosynthesis?', back: 'Process by which plants convert light to energy', type: policy as 'qa' },
        { front: 'Define mitosis', back: 'Cell division resulting in two identical daughter cells', type: policy as 'qa' },
        { front: 'What is ATP?', back: 'Adenosine triphosphate - energy currency of cells', type: policy as 'qa' },
      ].slice(0, count || 10)

      const now = new Date()
      const nextReview = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()

      writer.write({
        id: toolCallId,
        type: 'data-uni-flashcards',
        data: {
          count: cards.length,
          cards,
          scheduleMeta: {
            nextReview,
            interval: 1,
          },
          status: 'done',
        },
      })

      return `Generated ${cards.length} ${policy} flashcards from ${notePath}. Next review scheduled for tomorrow.`
    },
  })
