/**
 * Performance monitoring utilities for Phase 3.1.2 Backend Performance
 * Provides metrics collection and reporting without external dependencies
 */

interface PerformanceMetric {
  name: string
  duration: number
  timestamp: number
  metadata?: Record<string, any>
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private maxMetrics: number

  constructor(maxMetrics = 1000) {
    this.maxMetrics = maxMetrics
  }

  /**
   * Record a performance metric
   */
  record(name: string, duration: number, metadata?: Record<string, any>): void {
    // Evict oldest if at max
    if (this.metrics.length >= this.maxMetrics) {
      this.metrics.shift()
    }

    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
      metadata,
    })
  }

  /**
   * Time a function execution
   */
  async time<T>(
    name: string,
    fn: () => T | Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.record(name, duration, metadata)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.record(name, duration, { ...metadata, error: true })
      throw error
    }
  }

  /**
   * Get statistics for a specific metric name
   */
  getStats(name: string) {
    const filtered = this.metrics.filter((m) => m.name === name)
    if (filtered.length === 0) {
      return null
    }

    const durations = filtered.map((m) => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)
    const avg = sum / durations.length
    const sorted = [...durations].sort((a, b) => a - b)
    const p50 = sorted[Math.floor(sorted.length * 0.5)]
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]

    return {
      count: filtered.length,
      avg,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p50,
      p95,
      p99,
      recent: filtered.slice(-10).map((m) => ({
        duration: m.duration,
        timestamp: m.timestamp,
      })),
    }
  }

  /**
   * Get all unique metric names
   */
  getMetricNames(): string[] {
    return [...new Set(this.metrics.map((m) => m.name))]
  }

  /**
   * Get summary of all metrics
   */
  getSummary() {
    const names = this.getMetricNames()
    return names.reduce(
      (acc, name) => {
        const stats = this.getStats(name)
        if (stats) {
          acc[name] = {
            count: stats.count,
            avg: stats.avg,
            p50: stats.p50,
            p95: stats.p95,
          }
        }
        return acc
      },
      {} as Record<string, any>
    )
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }
}

// Global performance monitor
export const perfMonitor = new PerformanceMonitor(1000)

/**
 * Middleware to track API route performance
 */
export function withPerformanceTracking(
  handler: (req: Request) => Promise<Response>,
  routeName: string
) {
  return async (req: Request): Promise<Response> => {
    return perfMonitor.time(
      `api.${routeName}`,
      () => handler(req),
      {
        method: req.method,
        url: new URL(req.url).pathname,
      }
    )
  }
}

/**
 * Get performance report for monitoring dashboard
 */
export function getPerformanceReport() {
  return {
    summary: perfMonitor.getSummary(),
    metrics: perfMonitor.getMetricNames().map((name) => ({
      name,
      stats: perfMonitor.getStats(name),
    })),
    timestamp: new Date().toISOString(),
  }
}
