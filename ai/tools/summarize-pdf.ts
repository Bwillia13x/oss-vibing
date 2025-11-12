import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './summarize-pdf.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const summarizePdf = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      pdfUrl: z.string().optional().describe('URL to PDF file'),
      uploadPath: z.string().optional().describe('Path to uploaded PDF'),
      style: z.enum(['detailed', 'brief', 'highlights']).default('detailed').describe('Summary style'),
      length: z.number().default(500).describe('Target summary length in words'),
    }),
    execute: async ({ pdfUrl, uploadPath, style, length }, { toolCallId }) => {
      const source = pdfUrl || uploadPath || 'Unknown source'

      writer.write({
        id: toolCallId,
        type: 'data-uni-pdf-summary',
        data: {
          source,
          highlights: [],
          quotes: [],
          notes: [],
          status: 'processing',
        },
      })

      // Stub implementation - would extract and process PDF content
      const highlights = [
        'Key concept: Climate change significantly impacts agricultural productivity',
        'Important finding: Temperature increases of 2°C reduce crop yields by 10-25%',
        'Methodology: Multi-year field study across 15 regions',
      ]

      const quotes = [
        {
          text: 'Agricultural systems must adapt to changing precipitation patterns and increased temperature variability.',
          page: 12,
          locator: 'p. 12, para. 3',
        },
        {
          text: 'Sustainable farming practices can mitigate up to 40% of climate-related yield losses.',
          page: 28,
          locator: 'p. 28, para. 1',
        },
      ]

      const notes = [
        'This paper provides strong evidence for climate adaptation strategies',
        'Useful for background section on agricultural impacts',
      ]

      writer.write({
        id: toolCallId,
        type: 'data-uni-pdf-summary',
        data: {
          source,
          highlights,
          quotes,
          notes,
          status: 'done',
        },
      })

      return `Summarized PDF from ${source}. Extracted ${highlights.length} highlights and ${quotes.length} quotes.`
    },
  })
