import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './sheet-chart.md'
import z from 'zod/v3'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

export const sheetChart = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      sheetPath: z.string().describe('Path to the spreadsheet file'),
      range: z.string().describe('Data range for the chart (e.g., A1:D12)'),
      kind: z.enum(['line', 'bar', 'scatter', 'pie', 'area']).describe('Type of chart'),
      title: z.string().optional().describe('Chart title'),
      xAxis: z.string().optional().describe('X-axis label'),
      yAxis: z.string().optional().describe('Y-axis label'),
    }),
    execute: async ({ sheetPath, range, kind, title, xAxis, yAxis }, { toolCallId }) => {
      writer.write({
        id: toolCallId,
        type: 'data-uni-sheet-analyze',
        data: {
          range,
          ops: [],
          tables: [],
          charts: [],
          status: 'analyzing',
        },
      })

      // Stub implementation - would create chart specification
      const chartTitle = title || `${kind.charAt(0).toUpperCase() + kind.slice(1)} Chart`
      const charts = [
        {
          type: kind,
          title: chartTitle,
          range,
          xAxis: xAxis || 'X Axis',
          yAxis: yAxis || 'Y Axis',
        },
      ]

      writer.write({
        id: toolCallId,
        type: 'data-uni-sheet-analyze',
        data: {
          range,
          ops: [],
          tables: [],
          charts,
          status: 'done',
        },
      })

      return `Created ${kind} chart for ${sheetPath} range ${range}.`
    },
  })
