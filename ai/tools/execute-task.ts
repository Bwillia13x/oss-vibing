import { tool, type UIMessage, type UIMessageStreamWriter } from 'ai'
import z from 'zod/v3'
import { executeTask as executeTaskAction } from '@/app/actions/runTask'
import type { DataPart } from '@/ai/messages/data-parts'

export function executeTask(params?: { writer?: UIMessageStreamWriter<UIMessage<never, DataPart>> }) {
  return tool({
    description: 'Execute a planned finance task',
    inputSchema: z.object({
      task: z.any(),
    }),
    execute: async ({ task }, ctx) => {
      const result = await executeTaskAction(task)
      let out = `Task executed: ${result.kind}\nCost: $${result.cost}\nTokens: ${result.tokens}\nLatency: ${result.latencyMs}ms`

      // Preview URL: append to text and emit UI data part
      const writer = params?.writer ?? (ctx as any).writer
      out += result.previewUrl ? `\nPreview: ${result.previewUrl}` : ''
      if (result.previewUrl && writer) {
        writer.write({
          id: ctx.toolCallId,
          type: 'data-get-sandbox-url',
          data: { url: result.previewUrl, status: 'done' },
        })
      }

      // If chart, surface sandbox/command for logs streaming
      const kind = (task as Record<string, unknown> | undefined)?.['kind']
      if (typeof kind === 'string' && kind === 'chart' && writer) {
        const r: any = result
        if (r.sandboxId && r.command) {
          writer.write({
            id: ctx.toolCallId,
            type: 'data-run-command',
            data: {
              sandboxId: r.sandboxId,
              commandId: r.command.cmdId,
              command: r.command.command,
              args: r.command.args,
              status: 'running',
            },
          })
        }
      }

      // Append message, artifacts, citations compactly
      out += result.message ? `\n${result.message}` : ''
      out += result.artifacts?.length ? `\nArtifacts: ${result.artifacts.join(', ')}` : ''
      out += result.citations?.length ? `\nCitations: ${result.citations.join('; ')}` : ''

      // If DCF, emit a rich results UI part
      if (typeof kind === 'string' && kind === 'dcf' && writer && (result as any)?.result) {
        const r = (result as any).result
        writer.write({
          id: ctx.toolCallId,
          type: 'data-dcf-result',
          data: {
            assumptions: r.assumptions,
            pvByScenario: r.pvByScenario,
            sensitivity: r.sensitivity,
            artifacts: (result as any).artifacts,
            explain: r.explain,
          },
        })
      }
      return out
    },
  })
}
