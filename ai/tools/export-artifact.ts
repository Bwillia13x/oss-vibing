import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './export-artifact.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const exportArtifact = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      artifactPath: z.string().describe('Path to the artifact to export'),
      format: z.enum(['pdf', 'docx', 'pptx', 'csv', 'html', 'mdx']).describe('Export format'),
      options: z.object({
        includeProvenance: z.boolean().optional(),
        watermarkVisible: z.boolean().optional(),
      }).optional().describe('Export options'),
    }),
    execute: async ({ artifactPath, format, options }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-export',
        data: {
          artifactPath,
          format,
          exportPath: undefined,
          status: 'exporting',
        },
      })

      // Stub implementation - would convert and export artifact
      const fileName = artifactPath.split('/').pop()?.replace(/\.[^/.]+$/, '')
      const exportPath = `exports/${fileName}.${format}`

      writer.write({
        id: toolCallId,
        type: 'data-uni-export',
        data: {
          artifactPath,
          format,
          exportPath,
          status: 'done',
        },
      })

      const provenanceNote = options?.includeProvenance ? ' (with provenance metadata)' : ''
      return `Exported ${artifactPath} to ${exportPath} as ${format.toUpperCase()}${provenanceNote}`
    },
  })
