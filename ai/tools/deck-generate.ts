import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './deck-generate.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const deckGenerate = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      docPath: z.string().optional().describe('Path to source document'),
      outline: z.string().optional().describe('Outline text to convert'),
      slideCount: z.number().default(10).describe('Target number of slides'),
      theme: z.string().default('academic').describe('Presentation theme'),
    }),
    execute: async ({ docPath, outline, slideCount, theme }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-deck-generate',
        data: {
          slideTitles: [],
          slides: [],
          speakerNotes: [],
          status: 'generating',
        },
      })

      // Stub implementation - would generate actual deck
      const slideTitles = [
        'Title Slide',
        'Introduction',
        'Background',
        'Main Points',
        'Analysis',
        'Results',
        'Discussion',
        'Conclusion',
        'References',
        'Questions',
      ].slice(0, slideCount)

      const slides = slideTitles.map((title) => ({
        title,
        content: `Content for ${title} slide`,
      }))

      const speakerNotes = slides.map((s) => `Speaker notes for ${s.title}`)

      writer.write({
        id: toolCallId,
        type: 'data-uni-deck-generate',
        data: {
          slideTitles,
          slides,
          speakerNotes,
          status: 'done',
        },
      })

      return `Generated presentation with ${slides.length} slides using ${theme} theme.`
    },
  })
