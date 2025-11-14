/**
 * Audit Log Repository
 * 
 * Handles all audit log database operations
 */

import { AuditLog, AuditSeverity, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateAuditLogData {
  userId?: string
  action: string
  resource?: string
  resourceId?: string
  details?: Record<string, unknown>
  severity?: AuditSeverity
  ipAddress?: string
  userAgent?: string
}

export interface AuditLogFilters {
  userId?: string
  action?: string
  resource?: string
  severity?: AuditSeverity
  startDate?: Date
  endDate?: Date
}

export class AuditLogRepository extends BaseRepository {
  /**
   * Create a new audit log entry
   */
  async create(data: CreateAuditLogData): Promise<AuditLog> {
    return this.withRetry(
      async () => {
        return await this.prisma.auditLog.create({
          data: {
            userId: data.userId,
            action: data.action,
            resource: data.resource,
            resourceId: data.resourceId,
            details: data.details ? JSON.stringify(data.details) : null,
            severity: data.severity ?? 'INFO',
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
          },
        })
      },
      'createAuditLog'
    )
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.auditLog.findUnique({
          where: { id },
        })
      },
      'findAuditLogById'
    )
  }

  /**
   * List audit logs with pagination and filters
   */
  async list(
    filters?: AuditLogFilters,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<AuditLog>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.AuditLogWhereInput = {}

        if (filters?.userId) {
          where.userId = filters.userId
        }

        if (filters?.action) {
          where.action = filters.action
        }

        if (filters?.resource) {
          where.resource = filters.resource
        }

        if (filters?.severity) {
          where.severity = filters.severity
        }

        if (filters?.startDate || filters?.endDate) {
          where.timestamp = {}
          if (filters.startDate) {
            where.timestamp.gte = filters.startDate
          }
          if (filters.endDate) {
            where.timestamp.lte = filters.endDate
          }
        }

        const [data, total] = await Promise.all([
          this.prisma.auditLog.findMany({
            where,
            skip,
            take,
            orderBy: { timestamp: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                },
              },
            },
          }),
          this.prisma.auditLog.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'listAuditLogs'
    )
  }

  /**
   * Get audit logs for a specific user
   */
  async getByUser(userId: string, pagination?: PaginationOptions): Promise<PaginationResult<AuditLog>> {
    return this.list({ userId }, pagination)
  }

  /**
   * Get audit logs for a specific resource
   */
  async getByResource(
    resource: string,
    resourceId: string,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<AuditLog>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.AuditLogWhereInput = {
          resource,
          resourceId,
        }

        const [data, total] = await Promise.all([
          this.prisma.auditLog.findMany({
            where,
            skip,
            take,
            orderBy: { timestamp: 'desc' },
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  role: true,
                },
              },
            },
          }),
          this.prisma.auditLog.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'getAuditLogsByResource'
    )
  }

  /**
   * Count logs by severity
   */
  async countBySeverity(severity: AuditSeverity): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.auditLog.count({
          where: { severity },
        })
      },
      'countAuditLogsBySeverity'
    )
  }

  /**
   * Get recent critical logs
   */
  async getRecentCritical(limit = 10): Promise<AuditLog[]> {
    return this.withRetry(
      async () => {
        return await this.prisma.auditLog.findMany({
          where: {
            severity: 'CRITICAL',
          },
          take: limit,
          orderBy: { timestamp: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true,
              },
            },
          },
        })
      },
      'getRecentCriticalAuditLogs'
    )
  }

  /**
   * Delete old audit logs
   */
  async deleteOlderThan(date: Date): Promise<number> {
    return this.withRetry(
      async () => {
        const result = await this.prisma.auditLog.deleteMany({
          where: {
            timestamp: {
              lt: date,
            },
          },
        })
        return result.count
      },
      'deleteOldAuditLogs'
    )
  }
}

// Export singleton instance
export const auditLogRepository = new AuditLogRepository()
