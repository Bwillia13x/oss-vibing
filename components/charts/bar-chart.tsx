'use client'

/**
 * Bar Chart Component
 * 
 * Displays categorical data comparisons using Chart.js
 */

import React, { useRef, useEffect } from 'react'
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

export interface BarChartProps {
  data: ChartData<'bar'>
  options?: ChartOptions<'bar'>
  title?: string
  height?: number
  horizontal?: boolean
  className?: string
}

/**
 * Bar Chart for visualizing categorical comparisons
 */
export function BarChart({ 
  data, 
  options, 
  title = 'Bar Chart',
  height = 300,
  horizontal = false,
  className = ''
}: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS<'bar'> | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // Default options
    const defaultOptions: ChartOptions<'bar'> = {
      indexAxis: horizontal ? 'y' : 'x',
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
          mode: 'index',
          intersect: false,
        },
      },
      scales: {
        x: {
          display: true,
          title: {
            display: true,
            text: horizontal ? 'Value' : 'Category',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: horizontal ? 'Category' : 'Value',
          },
          beginAtZero: true,
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
      data,
      options: mergedOptions,
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, options, title, horizontal])

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
 * Helper function to create bar chart data
 */
export function createBarChartData(
  labels: string[],
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
  }>
): ChartData<'bar'> {
  return {
    labels,
    datasets: datasets.map((dataset, _index) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: dataset.backgroundColor || getDefaultColors(dataset.data.length, 0.6),
      borderColor: dataset.borderColor || getDefaultColors(dataset.data.length, 1),
      borderWidth: 1,
    })),
  }
}

/**
 * Get array of default chart colors
 */
function getDefaultColors(count: number, alpha: number = 1): string[] {
  const colors = [
    `rgba(54, 162, 235, ${alpha})`,  // Blue
    `rgba(255, 99, 132, ${alpha})`,  // Red
    `rgba(75, 192, 192, ${alpha})`,  // Green
    `rgba(255, 206, 86, ${alpha})`,  // Yellow
    `rgba(153, 102, 255, ${alpha})`, // Purple
    `rgba(255, 159, 64, ${alpha})`,  // Orange
  ]
  
  const result: string[] = []
  for (let i = 0; i < count; i++) {
    result.push(colors[i % colors.length])
  }
  return result
}

export default BarChart
