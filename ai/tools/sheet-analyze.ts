import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './sheet-analyze.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const sheetAnalyze = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      sheetPath: z.string().describe('Path to the spreadsheet file'),
      range: z.string().describe('Cell range to analyze (e.g., A1:D100)'),
      ops: z.array(z.enum(['describe', 'pivot', 'regress', 'corr', 'clean'])).describe('Operations to perform'),
    }),
    execute: async ({ sheetPath, range, ops }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-sheet-analyze',
        data: {
          range,
          ops,
          tables: [],
          charts: [],
          status: 'analyzing',
        },
      })

      // Stub implementation - would perform actual analysis
      const tables = ops.map((op) => ({
        name: `${op.charAt(0).toUpperCase() + op.slice(1)} Results`,
        data: { operation: op, range },
      }))

      writer.write({
        id: toolCallId,
        type: 'data-uni-sheet-analyze',
        data: {
          range,
          ops,
          tables,
          charts: [],
          status: 'done',
        },
      })

      return `Completed ${ops.length} analysis operations on ${sheetPath} range ${range}.`
    },
  })
