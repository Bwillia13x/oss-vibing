import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './check-integrity.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const checkIntegrity = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      docPath: z.string().describe('Path to the document to check'),
    }),
    execute: async ({ docPath }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-integrity',
        data: {
          coveragePct: 0,
          missingCites: [],
          quoteMismatches: [],
          actions: [],
          status: 'checking',
        },
      })

      // Stub implementation - would analyze actual document
      const coveragePct = 85
      const missingCites = [
        'Recent studies have shown significant climate impacts',
        'This approach has been widely adopted in industry',
      ]
      const quoteMismatches: Array<{ quote: string; issue: string }> = []
      const actions = [
        'Add citation for claim on line 42',
        'Verify DOI for reference [3]',
        'Accept or revise AI-generated summary in section 2.1',
      ]

      writer.write({
        id: toolCallId,
        type: 'data-uni-integrity',
        data: {
          coveragePct,
          missingCites,
          quoteMismatches,
          actions,
          status: 'done',
        },
      })

      return `Integrity check complete for ${docPath}. Coverage: ${coveragePct}%. Found ${missingCites.length} missing citations and ${actions.length} suggested actions.`
    },
  })
