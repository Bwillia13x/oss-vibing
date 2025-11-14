/**
 * Usage Metric Repository
 * 
 * Handles tracking and querying user activity metrics
 */

import { UsageMetric } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

interface CreateUsageMetricData {
  userId?: string
  metric: string
  value?: number
  metadata?: Record<string, unknown>
}

interface UsageMetricFilters {
  userId?: string
  metric?: string
  startDate?: Date
  endDate?: Date
}

export class UsageMetricRepository extends BaseRepository {
  /**
   * Create a new usage metric
   */
  async create(data: CreateUsageMetricData): Promise<UsageMetric> {
    return this.withRetry(async () => {
      return await this.prisma.usageMetric.create({
        data: {
          userId: data.userId,
          metric: data.metric,
          value: data.value ?? 1,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
        },
      })
    }, 'create usage metric')
  }

  /**
   * Find usage metric by ID
   */
  async findById(id: string): Promise<UsageMetric | null> {
    return this.withRetry(async () => {
      return await this.prisma.usageMetric.findUnique({
        where: { id },
      })
    }, 'find usage metric by id')
  }

  /**
   * List usage metrics with filters
   */
  async list(
    filters: UsageMetricFilters = {},
    options?: PaginationOptions
  ): Promise<PaginationResult<UsageMetric>> {
    return this.withRetry(async () => {
      const { skip, take, page, perPage } = this.buildPagination(options)

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {}

      if (filters.userId) {
        where.userId = filters.userId
      }

      if (filters.metric) {
        where.metric = filters.metric
      }

      if (filters.startDate || filters.endDate) {
        where.timestamp = {}
        if (filters.startDate) {
          where.timestamp.gte = filters.startDate
        }
        if (filters.endDate) {
          where.timestamp.lte = filters.endDate
        }
      }

      // Get total count and data
      const [total, data] = await Promise.all([
        this.prisma.usageMetric.count({ where }),
        this.prisma.usageMetric.findMany({
          where,
          skip,
          take,
          orderBy: { timestamp: 'desc' },
        }),
      ])

      return this.buildPaginationResult(data, total, page, perPage)
    }, 'list usage metrics')
  }

  /**
   * Get aggregated metrics for a user
   */
  async getUserMetrics(userId: string, startDate?: Date, endDate?: Date): Promise<{
    totalActivities: number
    metrics: Record<string, number>
  }> {
    return this.withRetry(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { userId }

      if (startDate || endDate) {
        where.timestamp = {}
        if (startDate) {
          where.timestamp.gte = startDate
        }
        if (endDate) {
          where.timestamp.lte = endDate
        }
      }

      const metrics = await this.prisma.usageMetric.findMany({
        where,
        select: {
          metric: true,
          value: true,
        },
      })

      const aggregated: Record<string, number> = {}
      let totalActivities = 0

      metrics.forEach(m => {
        aggregated[m.metric] = (aggregated[m.metric] || 0) + m.value
        totalActivities += m.value
      })

      return {
        totalActivities,
        metrics: aggregated,
      }
    }, 'get user metrics')
  }

  /**
   * Delete old metrics (for cleanup)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    return this.withRetry(async () => {
      const result = await this.prisma.usageMetric.deleteMany({
        where: {
          timestamp: {
            lt: date,
          },
        },
      })
      return result.count
    }, 'delete old metrics')
  }
}

// Export singleton instance
export const usageMetricRepository = new UsageMetricRepository()
