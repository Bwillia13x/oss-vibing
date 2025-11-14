/**
 * Citation Repository
 * 
 * Handles all citation-related database operations
 */

import { Citation, CitationType, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateCitationData {
  documentId: string
  referenceId: string
  userId: string
  location?: string
  context?: string
  type?: CitationType
}

export interface UpdateCitationData {
  location?: string
  context?: string
  type?: CitationType
}

export interface CitationFilters {
  documentId?: string
  referenceId?: string
  userId?: string
  type?: CitationType
}

export class CitationRepository extends BaseRepository {
  /**
   * Create a new citation
   */
  async create(data: CreateCitationData): Promise<Citation> {
    return this.withRetry(
      async () => {
        return await this.prisma.citation.create({
          data: {
            documentId: data.documentId,
            referenceId: data.referenceId,
            userId: data.userId,
            location: data.location,
            context: data.context,
            type: data.type ?? 'IN_TEXT',
          },
        })
      },
      'createCitation'
    )
  }

  /**
   * Find citation by ID
   */
  async findById(id: string): Promise<Citation | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.citation.findUnique({
          where: { id },
        })
      },
      'findCitationById'
    )
  }

  /**
   * Update citation
   */
  async update(id: string, data: UpdateCitationData): Promise<Citation> {
    return this.withRetry(
      async () => {
        return await this.prisma.citation.update({
          where: { id },
          data,
        })
      },
      'updateCitation'
    )
  }

  /**
   * Delete citation
   */
  async delete(id: string): Promise<Citation> {
    return this.withRetry(
      async () => {
        return await this.prisma.citation.delete({
          where: { id },
        })
      },
      'deleteCitation'
    )
  }

  /**
   * List citations with pagination and filters
   */
  async list(
    filters?: CitationFilters,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<Citation>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.CitationWhereInput = {}

        if (filters?.documentId) {
          where.documentId = filters.documentId
        }

        if (filters?.referenceId) {
          where.referenceId = filters.referenceId
        }

        if (filters?.userId) {
          where.userId = filters.userId
        }

        if (filters?.type) {
          where.type = filters.type
        }

        const [data, total] = await Promise.all([
          this.prisma.citation.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.citation.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'listCitations'
    )
  }

  /**
   * Find citations for a document with references
   */
  async findByDocumentWithReferences(documentId: string): Promise<unknown[]> {
    return this.withRetry(
      async () => {
        return await this.prisma.citation.findMany({
          where: { documentId },
          include: {
            reference: true,
          },
          orderBy: { createdAt: 'asc' },
        })
      },
      'findCitationsByDocumentWithReferences'
    )
  }

  /**
   * Count citations by document
   */
  async countByDocument(documentId: string): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.citation.count({
          where: { documentId },
        })
      },
      'countCitationsByDocument'
    )
  }

  /**
   * Count citations by reference
   */
  async countByReference(referenceId: string): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.citation.count({
          where: { referenceId },
        })
      },
      'countCitationsByReference'
    )
  }
}

// Export singleton instance
export const citationRepository = new CitationRepository()
