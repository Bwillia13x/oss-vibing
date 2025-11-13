/**
 * Monitoring and alerting utilities for Phase 3.1.2 Backend Performance
 * Provides performance tracking, error monitoring, and metric collection
 */

interface MetricData {
  name: string
  value: number
  timestamp: number
  tags?: Record<string, string>
}

interface ErrorData {
  message: string
  stack?: string
  timestamp: number
  context?: Record<string, any>
}

class MonitoringService {
  private metrics: MetricData[] = []
  private errors: ErrorData[] = []
  private maxMetrics = 1000
  private maxErrors = 100

  /**
   * Track a performance metric
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    const metric: MetricData = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    }

    this.metrics.push(metric)

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[METRIC]', name, ':', value, tags ? JSON.stringify(tags) : '')
    }
  }

  /**
   * Track an error
   */
  trackError(error: Error | string, context?: Record<string, any>): void {
    const errorData: ErrorData = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      timestamp: Date.now(),
      context,
    }

    this.errors.push(errorData)

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Log to console
    console.error(`[ERROR] ${errorData.message}`, {
      stack: errorData.stack,
      context: errorData.context,
    })
  }

  /**
   * Get recent metrics
   */
  getMetrics(name?: string, limit = 100): MetricData[] {
    let filtered = this.metrics
    if (name) {
      filtered = this.metrics.filter((m) => m.name === name)
    }
    return filtered.slice(-limit)
  }

  /**
   * Get recent errors
   */
  getErrors(limit = 50): ErrorData[] {
    return this.errors.slice(-limit)
  }

  /**
   * Get aggregated statistics for a metric
   */
  getMetricStats(name: string, periodMs = 60000): {
    count: number
    average: number
    min: number
    max: number
    p95: number
  } | null {
    const cutoff = Date.now() - periodMs
    const values = this.metrics
      .filter((m) => m.name === name && m.timestamp > cutoff)
      .map((m) => m.value)
      .sort((a, b) => a - b)

    if (values.length === 0) return null

    const sum = values.reduce((a, b) => a + b, 0)
    const p95Index = Math.floor(values.length * 0.95)

    return {
      count: values.length,
      average: sum / values.length,
      min: values[0],
      max: values[values.length - 1],
      p95: values[p95Index] || values[values.length - 1],
    }
  }

  /**
   * Clear all metrics and errors
   */
  clear(): void {
    this.metrics = []
    this.errors = []
  }
}

// Singleton instance
const monitoring = new MonitoringService()

/**
 * Helper to track API response time
 */
export async function trackApiPerformance<T>(
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    monitoring.trackMetric('api_response_time', duration, { endpoint })
    return result
  } catch (error) {
    const duration = Date.now() - start
    monitoring.trackMetric('api_response_time', duration, {
      endpoint,
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint })
    throw error
  }
}

/**
 * Helper to track database query performance
 */
export async function trackQueryPerformance<T>(
  query: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    monitoring.trackMetric('db_query_time', duration, { query })
    return result
  } catch (error) {
    const duration = Date.now() - start
    monitoring.trackMetric('db_query_time', duration, { query, error: 'true' })
    monitoring.trackError(error as Error, { query })
    throw error
  }
}

/**
 * Helper to track cache hit/miss
 */
export function trackCacheHit(key: string, hit: boolean): void {
  monitoring.trackMetric('cache_hit', hit ? 1 : 0, { key })
}

export default monitoring
