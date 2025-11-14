/**
 * Reference Repository
 * 
 * Handles all reference-related database operations
 */

import { Reference, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateReferenceData {
  userId: string
  doi?: string
  url?: string
  title: string
  authors: string[]
  year?: number
  journal?: string
  volume?: string
  pages?: string
  publisher?: string
  type?: string
  metadata?: Record<string, unknown>
}

export interface UpdateReferenceData {
  doi?: string
  url?: string
  title?: string
  authors?: string[]
  year?: number
  journal?: string
  volume?: string
  pages?: string
  publisher?: string
  type?: string
  metadata?: Record<string, unknown>
}

export interface ReferenceFilters {
  userId?: string
  doi?: string
  search?: string
}

export class ReferenceRepository extends BaseRepository {
  /**
   * Create a new reference
   */
  async create(data: CreateReferenceData): Promise<Reference> {
    return this.withRetry(
      async () => {
        return await this.prisma.reference.create({
          data: {
            userId: data.userId,
            doi: data.doi,
            url: data.url,
            title: data.title,
            authors: JSON.stringify(data.authors),
            year: data.year,
            journal: data.journal,
            volume: data.volume,
            pages: data.pages,
            publisher: data.publisher,
            type: data.type ?? 'article-journal',
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          },
        })
      },
      'createReference'
    )
  }

  /**
   * Find reference by ID
   */
  async findById(id: string): Promise<Reference | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.reference.findUnique({
          where: { id },
        })
      },
      'findReferenceById'
    )
  }

  /**
   * Find reference by DOI
   */
  async findByDoi(doi: string): Promise<Reference | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.reference.findFirst({
          where: { doi },
        })
      },
      'findReferenceByDoi'
    )
  }

  /**
   * Update reference
   */
  async update(id: string, data: UpdateReferenceData): Promise<Reference> {
    return this.withRetry(
      async () => {
        const updateData: Prisma.ReferenceUpdateInput = {}

        if (data.doi !== undefined) updateData.doi = data.doi
        if (data.url !== undefined) updateData.url = data.url
        if (data.title !== undefined) updateData.title = data.title
        if (data.authors !== undefined) updateData.authors = JSON.stringify(data.authors)
        if (data.year !== undefined) updateData.year = data.year
        if (data.journal !== undefined) updateData.journal = data.journal
        if (data.volume !== undefined) updateData.volume = data.volume
        if (data.pages !== undefined) updateData.pages = data.pages
        if (data.publisher !== undefined) updateData.publisher = data.publisher
        if (data.type !== undefined) updateData.type = data.type
        if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata)

        return await this.prisma.reference.update({
          where: { id },
          data: updateData,
        })
      },
      'updateReference'
    )
  }

  /**
   * Delete reference
   */
  async delete(id: string): Promise<Reference> {
    return this.withRetry(
      async () => {
        return await this.prisma.reference.delete({
          where: { id },
        })
      },
      'deleteReference'
    )
  }

  /**
   * List references with pagination and filters
   */
  async list(
    filters?: ReferenceFilters,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<Reference>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.ReferenceWhereInput = {}

        if (filters?.userId) {
          where.userId = filters.userId
        }

        if (filters?.doi) {
          where.doi = filters.doi
        }

        if (filters?.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { journal: { contains: filters.search, mode: 'insensitive' } },
            { publisher: { contains: filters.search, mode: 'insensitive' } },
          ]
        }

        const [data, total] = await Promise.all([
          this.prisma.reference.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.reference.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'listReferences'
    )
  }

  /**
   * Count references by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.reference.count({
          where: { userId },
        })
      },
      'countReferencesByUser'
    )
  }
}

// Export singleton instance
export const referenceRepository = new ReferenceRepository()
