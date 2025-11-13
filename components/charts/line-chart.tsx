'use client'

/**
 * Line Chart Component
 * 
 * Displays time series data and trends using Chart.js
 */

import React, { useRef, useEffect } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
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
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export interface LineChartProps {
  data: ChartData<'line'>
  options?: ChartOptions<'line'>
  title?: string
  height?: number
  className?: string
}

/**
 * Line Chart for visualizing time series and trends
 */
export function LineChart({ 
  data, 
  options, 
  title = 'Line Chart',
  height = 300,
  className = ''
}: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS<'line'> | null>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // Default options
    const defaultOptions: ChartOptions<'line'> = {
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
            text: 'X Axis',
          },
        },
        y: {
          display: true,
          title: {
            display: true,
            text: 'Y Axis',
          },
        },
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false,
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
      type: 'line',
      data,
      options: mergedOptions,
    })

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, options, title])

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
 * Helper function to create line chart data
 */
export function createLineChartData(
  labels: string[],
  datasets: Array<{
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
  }>
): ChartData<'line'> {
  return {
    labels,
    datasets: datasets.map((dataset, index) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: dataset.borderColor || getDefaultColor(index),
      backgroundColor: dataset.backgroundColor || getDefaultColor(index, 0.5),
      tension: 0.1, // Smooth lines
    })),
  }
}

/**
 * Get default chart colors
 */
function getDefaultColor(index: number, alpha: number = 1): string {
  const colors = [
    `rgba(54, 162, 235, ${alpha})`,  // Blue
    `rgba(255, 99, 132, ${alpha})`,  // Red
    `rgba(75, 192, 192, ${alpha})`,  // Green
    `rgba(255, 206, 86, ${alpha})`,  // Yellow
    `rgba(153, 102, 255, ${alpha})`, // Purple
    `rgba(255, 159, 64, ${alpha})`,  // Orange
  ]
  return colors[index % colors.length]
}

export default LineChart
