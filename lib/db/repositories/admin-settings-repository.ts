/**
 * Admin Settings Repository
 * 
 * Handles all admin settings database operations
 */

import { AdminSettings, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateAdminSettingData {
  key: string
  value: unknown
  category?: string
}

export interface UpdateAdminSettingData {
  value: unknown
  category?: string
}

export interface AdminSettingFilters {
  category?: string
  search?: string
}

export class AdminSettingsRepository extends BaseRepository {
  /**
   * Create or update a setting
   */
  async set(key: string, value: unknown, category = 'general'): Promise<AdminSettings> {
    return this.withRetry(
      async () => {
        return await this.prisma.adminSettings.upsert({
          where: { key },
          update: {
            value: JSON.stringify(value),
            category,
          },
          create: {
            key,
            value: JSON.stringify(value),
            category,
          },
        })
      },
      'setAdminSetting'
    )
  }

  /**
   * Get a setting by key
   */
  async get<T = unknown>(key: string): Promise<T | null> {
    return this.withRetry(
      async () => {
        const setting = await this.prisma.adminSettings.findUnique({
          where: { key },
        })
        
        if (!setting) return null
        
        try {
          return JSON.parse(setting.value) as T
        } catch {
          return setting.value as T
        }
      },
      'getAdminSetting'
    )
  }

  /**
   * Get a setting by key with default value
   */
  async getWithDefault<T>(key: string, defaultValue: T): Promise<T> {
    const value = await this.get<T>(key)
    return value ?? defaultValue
  }

  /**
   * Delete a setting
   */
  async delete(key: string): Promise<AdminSettings> {
    return this.withRetry(
      async () => {
        return await this.prisma.adminSettings.delete({
          where: { key },
        })
      },
      'deleteAdminSetting'
    )
  }

  /**
   * List settings with pagination and filters
   */
  async list(
    filters?: AdminSettingFilters,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<AdminSettings>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.AdminSettingsWhereInput = {}

        if (filters?.category) {
          where.category = filters.category
        }

        if (filters?.search) {
          where.OR = [
            { key: { contains: filters.search } },
          ]
        }

        const [data, total] = await Promise.all([
          this.prisma.adminSettings.findMany({
            where,
            skip,
            take,
            orderBy: { key: 'asc' },
          }),
          this.prisma.adminSettings.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'listAdminSettings'
    )
  }

  /**
   * Get all settings by category
   */
  async getByCategory(category: string): Promise<Record<string, unknown>> {
    return this.withRetry(
      async () => {
        const settings = await this.prisma.adminSettings.findMany({
          where: { category },
        })

        const result: Record<string, unknown> = {}
        for (const setting of settings) {
          try {
            result[setting.key] = JSON.parse(setting.value)
          } catch {
            result[setting.key] = setting.value
          }
        }

        return result
      },
      'getAdminSettingsByCategory'
    )
  }

  /**
   * Bulk set settings
   */
  async bulkSet(settings: Array<{ key: string; value: unknown; category?: string }>): Promise<number> {
    return this.transaction(async (tx) => {
      let count = 0
      for (const setting of settings) {
        await tx.adminSettings.upsert({
          where: { key: setting.key },
          update: {
            value: JSON.stringify(setting.value),
            category: setting.category ?? 'general',
          },
          create: {
            key: setting.key,
            value: JSON.stringify(setting.value),
            category: setting.category ?? 'general',
          },
        })
        count++
      }
      return count
    })
  }
}

// Export singleton instance
export const adminSettingsRepository = new AdminSettingsRepository()
