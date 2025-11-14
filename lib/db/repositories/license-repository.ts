/**
 * License Repository
 * 
 * Handles all license-related database operations
 */

import { License, LicenseStatus, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateLicenseData {
  institutionId: string
  institution: string
  seats: number
  expiresAt: Date
  status?: LicenseStatus
}

export interface UpdateLicenseData {
  institution?: string
  seats?: number
  usedSeats?: number
  status?: LicenseStatus
  expiresAt?: Date
}

export interface LicenseFilters {
  status?: LicenseStatus
  search?: string
}

export class LicenseRepository extends BaseRepository {
  /**
   * Create a new license
   */
  async create(data: CreateLicenseData): Promise<License> {
    return this.withRetry(
      async () => {
        return await this.prisma.license.create({
          data: {
            institutionId: data.institutionId,
            institution: data.institution,
            seats: data.seats,
            expiresAt: data.expiresAt,
            status: data.status ?? 'ACTIVE',
          },
        })
      },
      'createLicense'
    )
  }

  /**
   * Find license by ID
   */
  async findById(id: string): Promise<License | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.license.findUnique({
          where: { id },
        })
      },
      'findLicenseById'
    )
  }

  /**
   * Find license by institution ID
   */
  async findByInstitutionId(institutionId: string): Promise<License | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.license.findUnique({
          where: { institutionId },
        })
      },
      'findLicenseByInstitutionId'
    )
  }

  /**
   * Update license
   */
  async update(id: string, data: UpdateLicenseData): Promise<License> {
    return this.withRetry(
      async () => {
        return await this.prisma.license.update({
          where: { id },
          data,
        })
      },
      'updateLicense'
    )
  }

  /**
   * Delete license
   */
  async delete(id: string): Promise<License> {
    return this.withRetry(
      async () => {
        return await this.prisma.license.delete({
          where: { id },
        })
      },
      'deleteLicense'
    )
  }

  /**
   * List licenses with pagination and filters
   */
  async list(
    filters?: LicenseFilters,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<License>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.LicenseWhereInput = {}

        if (filters?.status) {
          where.status = filters.status
        }

        if (filters?.search) {
          where.OR = [
            { institution: { contains: filters.search, mode: 'insensitive' } },
            { institutionId: { contains: filters.search, mode: 'insensitive' } },
          ]
        }

        const [data, total] = await Promise.all([
          this.prisma.license.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.license.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'listLicenses'
    )
  }

  /**
   * Increment used seats
   */
  async incrementUsedSeats(id: string): Promise<License> {
    return this.withRetry(
      async () => {
        return await this.prisma.license.update({
          where: { id },
          data: {
            usedSeats: {
              increment: 1,
            },
          },
        })
      },
      'incrementLicenseUsedSeats'
    )
  }

  /**
   * Decrement used seats
   */
  async decrementUsedSeats(id: string): Promise<License> {
    return this.withRetry(
      async () => {
        return await this.prisma.license.update({
          where: { id },
          data: {
            usedSeats: {
              decrement: 1,
            },
          },
        })
      },
      'decrementLicenseUsedSeats'
    )
  }

  /**
   * Get license usage statistics
   */
  async getUsageStats(id: string): Promise<{
    seats: number
    usedSeats: number
    availableSeats: number
    utilizationRate: number
  } | null> {
    return this.withRetry(
      async () => {
        const license = await this.prisma.license.findUnique({
          where: { id },
        })

        if (!license) return null

        const availableSeats = license.seats - license.usedSeats
        const utilizationRate = (license.usedSeats / license.seats) * 100

        return {
          seats: license.seats,
          usedSeats: license.usedSeats,
          availableSeats,
          utilizationRate,
        }
      },
      'getLicenseUsageStats'
    )
  }

  /**
   * Check and update expired licenses
   */
  async updateExpiredLicenses(): Promise<number> {
    return this.withRetry(
      async () => {
        const result = await this.prisma.license.updateMany({
          where: {
            expiresAt: {
              lte: new Date(),
            },
            status: 'ACTIVE',
          },
          data: {
            status: 'EXPIRED',
          },
        })
        return result.count
      },
      'updateExpiredLicenses'
    )
  }
}

// Export singleton instance
export const licenseRepository = new LicenseRepository()
