'use client'

/**
 * Box Plot Component
 * 
 * Displays quartiles and outliers for data distribution analysis
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
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

export interface BoxPlotProps {
  data: number[] | number[][]
  labels?: string[]
  options?: ChartOptions<'bar'>
  title?: string
  showOutliers?: boolean
  height?: number
  className?: string
}

interface BoxPlotStats {
  min: number
  q1: number
  median: number
  q3: number
  max: number
  outliers: number[]
}

/**
 * Box Plot for visualizing data distribution and outliers
 */
export function BoxPlot({ 
  data, 
  labels,
  options: _options, 
  title = 'Box Plot',
  showOutliers = true,
  height = 300,
  className = ''
}: BoxPlotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Calculate box plot statistics
  const boxPlotData = useMemo(() => {
    const datasets = Array.isArray(data[0]) ? data as number[][] : [data as number[]]
    return datasets.map(dataset => calculateBoxPlotStats(dataset, showOutliers))
  }, [data, showOutliers])

  useEffect(() => {
    if (!canvasRef.current) return

    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Clear canvas before re-rendering
    const canvas = ctx.canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Create visualization using custom rendering
    renderBoxPlot(ctx, boxPlotData, labels || ['Dataset'], height)
  }, [boxPlotData, labels, height])

  /**
   * Export chart as PNG image
   */
  const exportToPNG = () => {
    if (!canvasRef.current) return

    const url = canvasRef.current.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '_')}.png`
    link.href = url
    link.click()
  }

  return (
    <div className={`relative ${className}`}>
      <div className="font-semibold text-lg mb-2">{title}</div>
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
 * Calculate box plot statistics
 */
function calculateBoxPlotStats(data: number[], detectOutliers: boolean): BoxPlotStats {
  if (data.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, outliers: [] }
  }
  
  const sorted = [...data].sort((a, b) => a - b)
  const n = sorted.length

  const q1 = quantile(sorted, 0.25)
  const median = quantile(sorted, 0.5)
  const q3 = quantile(sorted, 0.75)
  const iqr = q3 - q1

  let min = sorted[0]
  let max = sorted[n - 1]
  let outliers: number[] = []

  if (detectOutliers) {
    const lowerFence = q1 - 1.5 * iqr
    const upperFence = q3 + 1.5 * iqr

    outliers = sorted.filter(x => x < lowerFence || x > upperFence)
    
    const inliers = sorted.filter(x => x >= lowerFence && x <= upperFence)
    if (inliers.length > 0) {
      min = inliers[0]
      max = inliers[inliers.length - 1]
    }
  }

  return { min, q1, median, q3, max, outliers }
}

/**
 * Calculate quantile
 */
function quantile(sorted: number[], p: number): number {
  const index = (sorted.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower

  if (lower === upper) {
    return sorted[lower]
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight
}

/**
 * Custom box plot rendering
 */
function renderBoxPlot(
  ctx: CanvasRenderingContext2D,
  boxPlotData: BoxPlotStats[],
  labels: string[],
  height: number
) {
  const canvas = ctx.canvas
  const width = canvas.width
  const padding = 40
  const plotWidth = width - 2 * padding
  const plotHeight = height - 2 * padding

  // Find global min and max for scaling
  let globalMin = Infinity
  let globalMax = -Infinity
  
  boxPlotData.forEach(stats => {
    globalMin = Math.min(globalMin, stats.min, ...stats.outliers)
    globalMax = Math.max(globalMax, stats.max, ...stats.outliers)
  })

  const range = globalMax - globalMin
  const yScale = (value: number) => {
    return height - padding - ((value - globalMin) / range) * plotHeight
  }

  // Clear canvas
  ctx.clearRect(0, 0, width, height)

  // Draw background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // Draw each box plot
  const boxWidth = plotWidth / (boxPlotData.length * 2)
  const spacing = plotWidth / boxPlotData.length

  boxPlotData.forEach((stats, i) => {
    const x = padding + i * spacing + spacing / 2

    // Draw whiskers
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x, yScale(stats.min))
    ctx.lineTo(x, yScale(stats.q1))
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x, yScale(stats.q3))
    ctx.lineTo(x, yScale(stats.max))
    ctx.stroke()

    // Draw whisker caps
    ctx.beginPath()
    ctx.moveTo(x - boxWidth / 4, yScale(stats.min))
    ctx.lineTo(x + boxWidth / 4, yScale(stats.min))
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(x - boxWidth / 4, yScale(stats.max))
    ctx.lineTo(x + boxWidth / 4, yScale(stats.max))
    ctx.stroke()

    // Draw box
    const boxHeight = yScale(stats.q1) - yScale(stats.q3)
    ctx.fillStyle = 'rgba(54, 162, 235, 0.6)'
    ctx.strokeStyle = 'rgba(54, 162, 235, 1)'
    ctx.lineWidth = 2
    ctx.fillRect(x - boxWidth / 2, yScale(stats.q3), boxWidth, boxHeight)
    ctx.strokeRect(x - boxWidth / 2, yScale(stats.q3), boxWidth, boxHeight)

    // Draw median line
    ctx.strokeStyle = '#e74c3c'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(x - boxWidth / 2, yScale(stats.median))
    ctx.lineTo(x + boxWidth / 2, yScale(stats.median))
    ctx.stroke()

    // Draw outliers
    if (stats.outliers.length > 0) {
      ctx.fillStyle = '#e74c3c'
      stats.outliers.forEach(outlier => {
        ctx.beginPath()
        ctx.arc(x, yScale(outlier), 3, 0, 2 * Math.PI)
        ctx.fill()
      })
    }

    // Draw label
    ctx.fillStyle = '#333'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(labels[i] || `Dataset ${i + 1}`, x, height - padding + 20)
  })

  // Draw y-axis labels
  ctx.fillStyle = '#666'
  ctx.font = '10px Arial'
  ctx.textAlign = 'right'
  
  const numTicks = 5
  for (let i = 0; i <= numTicks; i++) {
    const value = globalMin + (range * i / numTicks)
    const y = yScale(value)
    ctx.fillText(value.toFixed(2), padding - 5, y + 3)
    
    // Draw grid line
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(width - padding, y)
    ctx.stroke()
  }
}

/**
 * Helper function to create box plot data
 */
export function createBoxPlotData(
  datasets: number[][],
  labels?: string[]
): { data: number[][], labels: string[] } {
  return {
    data: datasets,
    labels: labels || datasets.map((_, i) => `Dataset ${i + 1}`)
  }
}

export default BoxPlot
