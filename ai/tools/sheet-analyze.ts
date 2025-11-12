import type { UIMessageStreamWriter, UIMessage } from 'ai'
import type { DataPart } from '../messages/data-parts'
import { tool } from 'ai'
import description from './sheet-analyze.md'
import z from 'zod/v3'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as stats from 'simple-statistics'

interface Params {
  writer: UIMessageStreamWriter<UIMessage<never, DataPart>>
}

interface SheetData {
  name?: string
  tables: {
    [key: string]: {
      headers: string[]
      data: any[][]
    }
  }
}

// Extract numeric data from a column
function getNumericColumn(data: any[][], columnIndex: number): number[] {
  return data
    .map(row => row[columnIndex])
    .filter(val => typeof val === 'number' || !isNaN(Number(val)))
    .map(val => Number(val))
}

// Descriptive statistics
function performDescriptive(data: number[]) {
  if (data.length === 0) return null
  
  return {
    count: data.length,
    mean: stats.mean(data),
    median: stats.median(data),
    mode: stats.mode(data),
    stdDev: stats.standardDeviation(data),
    variance: stats.variance(data),
    min: stats.min(data),
    max: stats.max(data),
    q1: stats.quantile(data, 0.25),
    q3: stats.quantile(data, 0.75),
    iqr: stats.interquartileRange(data),
  }
}

// Correlation analysis
function performCorrelation(data1: number[], data2: number[]) {
  if (data1.length !== data2.length || data1.length === 0) return null
  
  return {
    pearson: stats.sampleCorrelation(data1, data2),
    covariance: stats.sampleCovariance(data1, data2),
  }
}

// Linear regression
function performRegression(xData: number[], yData: number[]) {
  if (xData.length !== yData.length || xData.length < 2) return null
  
  const regression = stats.linearRegression([xData, yData])
  const regressionLine = stats.linearRegressionLine(regression)
  
  // Calculate R²
  const predicted = xData.map(x => regressionLine(x))
  const residuals = yData.map((y, i) => y - predicted[i])
  const ssRes = residuals.reduce((sum, r) => sum + r * r, 0)
  const ssTot = yData.reduce((sum, y) => sum + Math.pow(y - stats.mean(yData), 2), 0)
  const rSquared = 1 - (ssRes / ssTot)
  
  return {
    slope: regression.m,
    intercept: regression.b,
    rSquared,
    equation: `y = ${regression.m.toFixed(4)}x + ${regression.b.toFixed(4)}`,
  }
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

      try {
        // Read sheet data
        const fullPath = path.join(process.cwd(), sheetPath)
        const fileContent = await fs.readFile(fullPath, 'utf-8')
        const sheetData: SheetData = JSON.parse(fileContent)
        
        // Get the first table for analysis (or specified table)
        const tableName = Object.keys(sheetData.tables)[0]
        const table = sheetData.tables[tableName]
        
        if (!table) {
          throw new Error('No table found in sheet')
        }

        const tables: any[] = []
        
        // Perform each operation
        for (const op of ops) {
          switch (op) {
            case 'describe': {
              // Analyze each numeric column
              const results: any = {}
              
              table.headers.forEach((header, index) => {
                const columnData = getNumericColumn(table.data, index)
                if (columnData.length > 0) {
                  results[header] = performDescriptive(columnData)
                }
              })
              
              tables.push({
                name: 'Descriptive Statistics',
                operation: 'describe',
                data: results,
                timestamp: new Date().toISOString(),
              })
              break
            }
            
            case 'corr': {
              // Correlation matrix for numeric columns
              const numericColumns = table.headers
                .map((header, index) => ({
                  name: header,
                  index,
                  data: getNumericColumn(table.data, index),
                }))
                .filter(col => col.data.length > 0)
              
              const correlationMatrix: any = {}
              
              for (let i = 0; i < numericColumns.length; i++) {
                correlationMatrix[numericColumns[i].name] = {}
                for (let j = 0; j < numericColumns.length; j++) {
                  const corr = performCorrelation(
                    numericColumns[i].data,
                    numericColumns[j].data
                  )
                  correlationMatrix[numericColumns[i].name][numericColumns[j].name] = 
                    corr?.pearson ?? null
                }
              }
              
              tables.push({
                name: 'Correlation Matrix',
                operation: 'corr',
                data: correlationMatrix,
                timestamp: new Date().toISOString(),
              })
              break
            }
            
            case 'regress': {
              // Perform regression on first two numeric columns
              const numericColumns = table.headers
                .map((header, index) => ({
                  name: header,
                  index,
                  data: getNumericColumn(table.data, index),
                }))
                .filter(col => col.data.length > 0)
              
              if (numericColumns.length >= 2) {
                const regression = performRegression(
                  numericColumns[0].data,
                  numericColumns[1].data
                )
                
                tables.push({
                  name: 'Linear Regression',
                  operation: 'regress',
                  data: {
                    xVariable: numericColumns[0].name,
                    yVariable: numericColumns[1].name,
                    ...regression,
                  },
                  timestamp: new Date().toISOString(),
                })
              }
              break
            }
            
            case 'clean': {
              // Data cleaning operations
              const cleanedData = table.data.filter(row => 
                row.some(cell => cell !== null && cell !== undefined && cell !== '')
              )
              
              tables.push({
                name: 'Data Cleaning Results',
                operation: 'clean',
                data: {
                  originalRows: table.data.length,
                  cleanedRows: cleanedData.length,
                  removedRows: table.data.length - cleanedData.length,
                },
                timestamp: new Date().toISOString(),
              })
              break
            }
            
            case 'pivot': {
              // Simplified pivot operation
              tables.push({
                name: 'Pivot Table',
                operation: 'pivot',
                data: {
                  note: 'Pivot operation requires grouping and aggregation specification',
                },
                timestamp: new Date().toISOString(),
              })
              break
            }
          }
        }

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

        return `Completed ${ops.length} analysis operations on ${sheetPath}. Results include: ${ops.join(', ')}.`
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        
        writer.write({
          id: toolCallId,
          type: 'data-uni-sheet-analyze',
          data: {
            range,
            ops,
            tables: [],
            charts: [],
            status: 'error',
            error: { message: errorMessage },
          },
        })
        
        return `Error analyzing ${sheetPath}: ${errorMessage}`
      }
    },
  })
