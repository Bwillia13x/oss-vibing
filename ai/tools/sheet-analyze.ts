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
  // Validate column index
  if (data.length === 0) return []
  if (columnIndex < 0 || columnIndex >= data[0].length) {
    throw new Error(`Invalid column index: ${columnIndex}. Valid range: 0-${data[0].length - 1}`)
  }
  
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

// T-test (independent samples)
function performTTest(sample1: number[], sample2: number[]) {
  if (sample1.length < 2 || sample2.length < 2) return null
  
  const mean1 = stats.mean(sample1)
  const mean2 = stats.mean(sample2)
  const variance1 = stats.variance(sample1)
  const variance2 = stats.variance(sample2)
  const n1 = sample1.length
  const n2 = sample2.length
  
  // Pooled standard deviation
  const pooledVariance = ((n1 - 1) * variance1 + (n2 - 1) * variance2) / (n1 + n2 - 2)
  const standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2))
  
  // T-statistic
  const tStat = (mean1 - mean2) / standardError
  
  // Degrees of freedom
  const df = n1 + n2 - 2
  
  return {
    tStatistic: tStat,
    degreesOfFreedom: df,
    mean1,
    mean2,
    meanDifference: mean1 - mean2,
    standardError,
    // Significance is determined using a rough approximation: |t| > 2.0 is used for 95% confidence.
    // This is only appropriate for large sample sizes (degrees of freedom > 30). For small samples,
    // the critical value is higher and this test may incorrectly indicate significance. For accurate
    // results, use a proper t-distribution table or statistical library to compute the p-value.
    significant: Math.abs(tStat) > 2.0,
  }
}

// One-way ANOVA
function performANOVA(groups: number[][]) {
  if (groups.length < 2 || groups.some(g => g.length < 2)) return null
  
  // Grand mean
  const allData = groups.flat()
  const grandMean = stats.mean(allData)
  const totalN = allData.length
  
  // Between-group sum of squares (SSB)
  let ssb = 0
  for (const group of groups) {
    const groupMean = stats.mean(group)
    ssb += group.length * Math.pow(groupMean - grandMean, 2)
  }
  
  // Within-group sum of squares (SSW)
  let ssw = 0
  for (const group of groups) {
    const groupMean = stats.mean(group)
    for (const value of group) {
      ssw += Math.pow(value - groupMean, 2)
    }
  }
  
  // Degrees of freedom
  const dfBetween = groups.length - 1
  const dfWithin = totalN - groups.length
  
  // Mean squares
  const msb = ssb / dfBetween
  const msw = ssw / dfWithin
  
  // F-statistic
  const fStat = msb / msw
  
  return {
    fStatistic: fStat,
    dfBetween,
    dfWithin,
    ssb,
    ssw,
    msb,
    msw,
    // Rough significance test: F > 4.0 is a very approximate threshold for significance at α ≈ 0.05,
    // assuming small samples (e.g., numerator df ≈ 1-3, denominator df ≈ 10-30).
    // For accurate results, consult F-distribution tables or use a statistical library to compute the p-value.
    significant: fStat > 4.0,
  }
}

// Chi-square test of independence
function performChiSquare(observed: number[][]) {
  if (observed.length < 2 || observed[0].length < 2) return null
  
  const rows = observed.length
  const cols = observed[0].length
  
  // Calculate row and column totals
  const rowTotals = observed.map(row => row.reduce((a, b) => a + b, 0))
  const colTotals: number[] = []
  for (let j = 0; j < cols; j++) {
    colTotals[j] = observed.reduce((sum, row) => sum + row[j], 0)
  }
  const grandTotal = rowTotals.reduce((a, b) => a + b, 0)
  
  // Calculate expected frequencies and chi-square statistic
  let chiSquare = 0
  const expected: number[][] = []
  
  for (let i = 0; i < rows; i++) {
    expected[i] = []
    for (let j = 0; j < cols; j++) {
      const exp = (rowTotals[i] * colTotals[j]) / grandTotal
      expected[i][j] = exp
      chiSquare += Math.pow(observed[i][j] - exp, 2) / exp
    }
  }
  
  const df = (rows - 1) * (cols - 1)
  
  // Get approximate critical value based on degrees of freedom
  // These are rough approximations for p=0.05
  const getCriticalValue = (df: number): number => {
    if (df === 1) return 3.84
    if (df === 2) return 5.99
    if (df === 3) return 7.81
    if (df === 4) return 9.49
    if (df <= 6) return 12.59
    if (df <= 9) return 16.92
    // For larger df, use rough approximation
    return df + Math.sqrt(2 * df) * 1.645
  }
  
  const criticalValue = getCriticalValue(df)
  
  return {
    chiSquare,
    degreesOfFreedom: df,
    expected,
    observed,
    // Significance is determined using approximate critical values for p=0.05.
    // For df=1: 3.84, df=2: 5.99, df=3: 7.81, etc.
    // For accurate results, consult chi-square distribution tables.
    significant: chiSquare > criticalValue,
  }
}

// Confidence interval
function calculateConfidenceInterval(data: number[], confidenceLevel = 0.95) {
  if (data.length < 2) return null
  
  const mean = stats.mean(data)
  const stdDev = stats.standardDeviation(data)
  const n = data.length
  
  // For 95% confidence, use z-score of ~1.96 (or t-score for small samples)
  // Note: This uses z-distribution which is only accurate for large samples (n >= 30).
  // For small samples (n < 30), a t-distribution should be used for accurate results.
  const zScore = 1.96
  const marginOfError = zScore * (stdDev / Math.sqrt(n))
  
  const result = {
    mean,
    confidenceLevel,
    marginOfError,
    lowerBound: mean - marginOfError,
    upperBound: mean + marginOfError,
    interval: `[${(mean - marginOfError).toFixed(4)}, ${(mean + marginOfError).toFixed(4)}]`,
  }
  
  // Add warning for small sample sizes
  if (n < 30) {
    return {
      ...result,
      warning: `Small sample size (n=${n}). For accurate results with n < 30, use t-distribution instead of z-distribution.`,
    }
  }
  
  return result
}

export const sheetAnalyze = ({ writer }: Params) =>
  tool({
    description,
    inputSchema: z.object({
      sheetPath: z.string().describe('Path to the spreadsheet file'),
      range: z.string().describe('Cell range to analyze (e.g., A1:D100)'),
      ops: z.array(z.enum(['describe', 'pivot', 'regress', 'corr', 'clean', 'ttest', 'anova', 'chisquare', 'confidence'])).describe('Operations to perform'),
      groups: z.array(z.string()).optional().describe('Column names for group comparisons (for t-test, ANOVA)'),
      confidenceLevel: z.number().optional().describe('Confidence level for confidence intervals (default 0.95)'),
    }),
    execute: async ({ sheetPath, range, ops, groups, confidenceLevel }, { toolCallId }) => {
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
            
            case 'ttest': {
              // T-test between two groups
              if (!groups || groups.length < 2) {
                tables.push({
                  name: 'T-Test',
                  operation: 'ttest',
                  data: {
                    error: 'Two groups required for t-test',
                  },
                  timestamp: new Date().toISOString(),
                })
                break
              }
              
              const group1Index = table.headers.indexOf(groups[0])
              const group2Index = table.headers.indexOf(groups[1])
              
              if (group1Index === -1 || group2Index === -1) {
                tables.push({
                  name: 'T-Test',
                  operation: 'ttest',
                  data: {
                    error: 'Groups not found in table headers',
                  },
                  timestamp: new Date().toISOString(),
                })
                break
              }
              
              const sample1 = getNumericColumn(table.data, group1Index)
              const sample2 = getNumericColumn(table.data, group2Index)
              const result = performTTest(sample1, sample2)
              
              tables.push({
                name: 'Independent Samples T-Test',
                operation: 'ttest',
                data: {
                  group1: groups[0],
                  group2: groups[1],
                  ...result,
                },
                timestamp: new Date().toISOString(),
              })
              break
            }
            
            case 'anova': {
              // One-way ANOVA
              if (!groups || groups.length < 2) {
                tables.push({
                  name: 'ANOVA',
                  operation: 'anova',
                  data: {
                    error: 'At least two groups required for ANOVA',
                  },
                  timestamp: new Date().toISOString(),
                })
                break
              }
              
              const groupData: number[][] = []
              for (const groupName of groups) {
                const groupIndex = table.headers.indexOf(groupName)
                if (groupIndex !== -1) {
                  groupData.push(getNumericColumn(table.data, groupIndex))
                }
              }
              
              if (groupData.length < 2) {
                tables.push({
                  name: 'ANOVA',
                  operation: 'anova',
                  data: {
                    error: 'Groups not found in table headers',
                  },
                  timestamp: new Date().toISOString(),
                })
                break
              }
              
              const result = performANOVA(groupData)
              
              tables.push({
                name: 'One-Way ANOVA',
                operation: 'anova',
                data: {
                  groups: groups.slice(0, groupData.length),
                  ...result,
                },
                timestamp: new Date().toISOString(),
              })
              break
            }
            
            case 'chisquare': {
              // Chi-square test - requires categorical data in matrix form
              // For simplicity, use first few columns as observed frequencies
              if (table.data.length < 2 || table.data[0].length < 2) {
                tables.push({
                  name: 'Chi-Square Test',
                  operation: 'chisquare',
                  data: {
                    error: 'Requires at least 2x2 matrix of observed frequencies',
                  },
                  timestamp: new Date().toISOString(),
                })
                break
              }
              
              const observed = table.data.slice(0, Math.min(5, table.data.length)).map(row => 
                row.slice(0, Math.min(5, row.length))
                  .filter(val => typeof val === 'number' || !isNaN(Number(val)))
                  .map(val => Number(val))
              ).filter(row => row.length >= 2)
              
              const result = performChiSquare(observed)
              
              tables.push({
                name: 'Chi-Square Test of Independence',
                operation: 'chisquare',
                data: result,
                timestamp: new Date().toISOString(),
              })
              break
            }
            
            case 'confidence': {
              // Confidence intervals for all numeric columns
              const results: any = {}
              const level = confidenceLevel || 0.95
              
              table.headers.forEach((header, index) => {
                const columnData = getNumericColumn(table.data, index)
                if (columnData.length > 0) {
                  results[header] = calculateConfidenceInterval(columnData, level)
                }
              })
              
              tables.push({
                name: 'Confidence Intervals',
                operation: 'confidence',
                data: results,
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
