'use client'

/**
 * Scatter Plot Component
 * 
 * Displays correlation and relationship between two variables using Chart.js
 */

import React, { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'

ChartJS.register(
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export interface ScatterPlotProps {
  xData: number[]
  yData: number[]
  options?: ChartOptions<'scatter'>
  title?: string
  xLabel?: string
  yLabel?: string
  showTrendline?: boolean
  height?: number
  className?: string
}

/**
 * Scatter Plot for visualizing correlations
 */
export function ScatterPlot({ 
  xData,
  yData,
  options, 
  title = 'Scatter Plot',
  xLabel = 'X Variable',
  yLabel = 'Y Variable',
  showTrendline = false,
  height = 300,
  className = ''
}: ScatterPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS<'scatter'> | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // Convert arrays to scatter data points
    const scatterData = xData.map((x, i) => ({ x, y: yData[i] }))

    // Calculate trendline if requested
    const datasets: any[] = [
      {
        label: 'Data Points',
        data: scatterData,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        pointRadius: 5,
        pointHoverRadius: 7,
      }
    ]

    if (showTrendline) {
      const trendline = calculateTrendline(xData, yData)
      datasets.push({
        label: 'Trendline',
        data: trendline,
        type: 'line',
        borderColor: 'rgba(255, 99, 132, 0.8)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: false,
      })
    }

    const chartData: ChartData<'scatter'> = {
      datasets,
    }

    // Default options
    const defaultOptions: ChartOptions<'scatter'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: !!title,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const point = context.raw as { x: number; y: number }
              return `(${point.x.toFixed(2)}, ${point.y.toFixed(2)})`
            }
          }
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: xLabel,
          },
        },
        y: {
          type: 'linear',
          title: {
            display: true,
            text: yLabel,
          },
        },
      },
    }

    // Merge with custom options
    const mergedOptions = {
      ...defaultOptions,
      ...options,
      plugins: {
        ...defaultOptions.plugins,
        ...options?.plugins,
      },
    }

    // Create new chart
    chartRef.current = new ChartJS(ctx, {
      type: 'scatter',
      data: chartData,
      options: mergedOptions,
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [xData, yData, options, title, xLabel, yLabel, showTrendline])

  /**
   * Export chart as PNG image
   */
  const exportToPNG = () => {
    if (!chartRef.current) return

    const url = chartRef.current.toBase64Image()
    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '_')}.png`
    link.href = url
    link.click()
  }

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} height={height} />
      <button
        onClick={exportToPNG}
        className="absolute top-2 right-2 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Export PNG
      </button>
    </div>
  )
}

/**
 * Calculate trendline using linear regression
 */
function calculateTrendline(xData: number[], yData: number[]): Array<{ x: number; y: number }> {
  const n = xData.length
  
  // Calculate means
  const xMean = xData.reduce((a, b) => a + b, 0) / n
  const yMean = yData.reduce((a, b) => a + b, 0) / n
  
  // Calculate slope and intercept
  let numerator = 0
  let denominator = 0
  
  for (let i = 0; i < n; i++) {
    numerator += (xData[i] - xMean) * (yData[i] - yMean)
    denominator += Math.pow(xData[i] - xMean, 2)
  }
  
  // Handle edge case: all x-values are the same (vertical line, undefined slope)
  if (denominator === 0) {
    // Return a horizontal line at yMean
    const minX = Math.min(...xData)
    const maxX = Math.max(...xData)
    return [
      { x: minX, y: yMean },
      { x: maxX, y: yMean },
    ]
  }
  
  const slope = numerator / denominator
  const intercept = yMean - slope * xMean
  
  // Create trendline points
  const minX = Math.min(...xData)
  const maxX = Math.max(...xData)
  
  return [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ]
}

/**
 * Helper function to create scatter plot data
 */
export function createScatterData(
  xData: number[],
  yData: number[],
  label: string = 'Data Points'
): ChartData<'scatter'> {
  const data = xData.map((x, i) => ({ x, y: yData[i] }))
  
  return {
    datasets: [
      {
        label,
        data,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
      },
    ],
  }
}

export default ScatterPlot
