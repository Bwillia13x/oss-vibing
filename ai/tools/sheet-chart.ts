import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './sheet-chart.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'
import type { ChartConfig } from './types'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface SheetData {
  name?: string
  tables: {
    [key: string]: {
      headers: string[]
      data: unknown[][]
    }
  }
  charts?: ChartConfig[]
}

interface ChartDataPoint {
  index: number;
  [key: string]: unknown;
}

// Extract data for chart from table
function extractChartData(table: { headers: string[]; data: unknown[][] }, _range: string): ChartDataPoint[] {
  // Simple range parsing - assumes format like "A1:D12"
  // For a real implementation, would parse the range properly
  
  // For now, return all data with headers
  const chartData = table.data.map((row, index): ChartDataPoint => {
    const dataPoint: ChartDataPoint = { index: index + 1 }
    table.headers.forEach((header, i) => {
      dataPoint[header] = row[i]
    })
    return dataPoint
  })
  
  return chartData
}

// Predefined color palette with good contrast and accessibility
const COLOR_PALETTE = [
  { stroke: 'hsl(210, 70%, 50%)', fill: 'hsl(210, 70%, 50%)' }, // Blue
  { stroke: 'hsl(340, 70%, 50%)', fill: 'hsl(340, 70%, 50%)' }, // Red
  { stroke: 'hsl(120, 70%, 45%)', fill: 'hsl(120, 70%, 45%)' }, // Green
  { stroke: 'hsl(280, 70%, 50%)', fill: 'hsl(280, 70%, 50%)' }, // Purple
  { stroke: 'hsl(30, 70%, 50%)', fill: 'hsl(30, 70%, 50%)' },   // Orange
  { stroke: 'hsl(180, 70%, 45%)', fill: 'hsl(180, 70%, 45%)' }, // Cyan
  { stroke: 'hsl(50, 70%, 50%)', fill: 'hsl(50, 70%, 50%)' },   // Yellow
  { stroke: 'hsl(300, 70%, 50%)', fill: 'hsl(300, 70%, 50%)' }, // Magenta
]

// Create chart configuration for Recharts
function createChartConfig(
  kind: string,
  data: ChartDataPoint[],
  headers: string[],
  title?: string,
  xAxis?: string,
  yAxis?: string
): ChartConfig {
  const chartTitle = title || `${kind.charAt(0).toUpperCase() + kind.slice(1)} Chart`
  
  // Determine axes
  const xAxisKey = xAxis || headers[0] || 'index'
  const yAxisKeys = yAxis ? [yAxis] : headers.slice(1)
  
  const config: ChartConfig = {
    id: `chart-${Date.now()}`,
    type: kind,
    title: chartTitle,
    data,
    xAxis: {
      dataKey: xAxisKey,
      label: xAxisKey,
    },
    yAxis: {
      label: yAxis || 'Value',
    },
    series: yAxisKeys.map((key, index) => ({
      dataKey: key,
      name: key,
      // Use predefined colors from palette, cycling if needed
      stroke: COLOR_PALETTE[index % COLOR_PALETTE.length].stroke,
      fill: COLOR_PALETTE[index % COLOR_PALETTE.length].fill,
    })),
    createdAt: new Date().toISOString(),
  }
  
  return config
}

export const sheetChart = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      sheetPath: z.string().describe('Path to the spreadsheet file'),
      range: z.string().describe('Data range for the chart (e.g., A1:D12)'),
      kind: z.enum(['line', 'bar', 'scatter', 'pie', 'area']).describe('Type of chart'),
      title: z.string().optional().describe('Chart title'),
      xAxis: z.string().optional().describe('X-axis label or column name'),
      yAxis: z.string().optional().describe('Y-axis label or column name'),
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

      try {
        // Read sheet data
        const fullPath = path.join(process.cwd(), sheetPath)
        const fileContent = await fs.readFile(fullPath, 'utf-8')
        const sheetData: SheetData = JSON.parse(fileContent)
        
        // Get the first table
        const tableName = Object.keys(sheetData.tables)[0]
        const table = sheetData.tables[tableName]
        
        if (!table) {
          throw new Error('No table found in sheet')
        }
        
        // Extract data for chart
        const chartData = extractChartData(table, range)
        
        // Create chart configuration
        const chartConfig = createChartConfig(
          kind,
          chartData,
          table.headers,
          title,
          xAxis,
          yAxis
        )
        
        // Add chart to sheet data
        if (!sheetData.charts) {
          sheetData.charts = []
        }
        sheetData.charts.push(chartConfig)
        
        // Save updated sheet
        await fs.writeFile(fullPath, JSON.stringify(sheetData, null, 2))
        
        // Prepare chart for response
        const charts = [{
          type: kind as string,
          title: chartConfig.title || 'Untitled Chart',
        }]

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

        return `Created ${kind} chart "${chartConfig.title}" for ${sheetPath}. Chart saved to sheet file with ${chartData.length} data points.`
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        writer.write({
          id: toolCallId,
          type: 'data-uni-sheet-analyze',
          data: {
            range,
            ops: [],
            tables: [],
            charts: [],
            status: 'error',
            error: { message: errorMessage },
          },
        })
        
        return `Error creating chart: ${errorMessage}`
      }
    },
  })
