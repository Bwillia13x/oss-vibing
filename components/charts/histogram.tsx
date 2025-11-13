'use client'

/**
 * Histogram Component
 * 
 * Displays distribution of data using binned frequencies
 */

import React, { useRef, useEffect, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export interface HistogramProps {
  data: number[]
  bins?: number
  options?: ChartOptions<'bar'>
  title?: string
  xLabel?: string
  yLabel?: string
  height?: number
  className?: string
}

/**
 * Histogram for visualizing data distributions
 */
export function Histogram({ 
  data, 
  bins = 10,
  options, 
  title = 'Histogram',
  xLabel = 'Value',
  yLabel = 'Frequency',
  height = 300,
  className = ''
}: HistogramProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS<'bar'> | null>(null)

  // Calculate histogram data
  const histogramData = useMemo(() => {
    return calculateHistogram(data, bins)
  }, [data, bins])

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    const chartData: ChartData<'bar'> = {
      labels: histogramData.labels,
      datasets: [
        {
          label: 'Frequency',
          data: histogramData.frequencies,
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    }

    // Default options
    const defaultOptions: ChartOptions<'bar'> = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: !!title,
          text: title,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.y
              if (value === null) return ''
              const total = histogramData.frequencies.reduce((a, b) => a + b, 0)
              const percentage = ((value / total) * 100).toFixed(1)
              return `Frequency: ${value} (${percentage}%)`
            }
          }
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: xLabel,
          },
          grid: {
            display: false,
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: yLabel,
          },
          beginAtZero: true,
          ticks: {
            precision: 0,
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
      type: 'bar',
      data: chartData,
      options: mergedOptions,
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [histogramData, options, title, xLabel, yLabel])

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
 * Calculate histogram bins and frequencies
 */
function calculateHistogram(data: number[], numBins: number): {
  labels: string[]
  frequencies: number[]
  binEdges: number[]
} {
  if (data.length === 0) {
    return { labels: [], frequencies: [], binEdges: [] }
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  
  // Handle edge case where all values are the same
  if (min === max) {
    return {
      labels: [`${min.toFixed(2)}`],
      frequencies: [data.length],
      binEdges: [min, min]
    }
  }
  
  const binWidth = (max - min) / numBins

  // Create bin edges
  const binEdges: number[] = []
  for (let i = 0; i <= numBins; i++) {
    binEdges.push(min + i * binWidth)
  }

  // Count frequencies
  const frequencies: number[] = new Array(numBins).fill(0)
  
  for (const value of data) {
    // Find which bin this value belongs to
    let binIndex = Math.floor((value - min) / binWidth)
    
    // Handle edge case where value equals max
    if (binIndex === numBins) {
      binIndex = numBins - 1
    }
    
    // Ensure bin index is valid
    if (binIndex >= 0 && binIndex < numBins) {
      frequencies[binIndex]++
    }
  }

  // Create labels
  const labels: string[] = []
  for (let i = 0; i < numBins; i++) {
    const start = binEdges[i].toFixed(2)
    const end = binEdges[i + 1].toFixed(2)
    labels.push(`${start}-${end}`)
  }

  return { labels, frequencies, binEdges }
}

/**
 * Helper to suggest optimal number of bins using Sturges' rule
 */
export function suggestBinCount(dataLength: number): number {
  return Math.ceil(Math.log2(dataLength) + 1)
}

/**
 * Helper to suggest optimal number of bins using Scott's rule
 */
export function suggestBinCountScott(data: number[]): number {
  const n = data.length
  if (n < 2) {
    // Not enough data to calculate variance, return 1 bin as default
    return 1
  }
  const mean = data.reduce((a, b) => a + b, 0) / n
  const variance = data.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / (n - 1)
  const stdDev = Math.sqrt(variance)
  
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min
  
  const binWidth = 3.5 * stdDev / Math.pow(n, 1/3)
  return Math.ceil(range / binWidth)
}

export default Histogram
