/**
 * Document Repository
 * 
 * Handles all document-related database operations
 */

import { Document, DocumentType, DocumentStatus, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateDocumentData {
  userId: string
  title: string
  content: string
  type?: DocumentType
  status?: DocumentStatus
  folder?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface UpdateDocumentData {
  title?: string
  content?: string
  type?: DocumentType
  status?: DocumentStatus
  folder?: string
  tags?: string[]
  metadata?: Record<string, unknown>
}

export interface DocumentFilters {
  userId?: string
  type?: DocumentType
  status?: DocumentStatus
  folder?: string
  search?: string
}

export class DocumentRepository extends BaseRepository {
  /**
   * Create a new document
   */
  async create(data: CreateDocumentData): Promise<Document> {
    return this.withRetry(
      async () => {
        return await this.prisma.document.create({
          data: {
            userId: data.userId,
            title: data.title,
            content: data.content,
            type: data.type ?? 'NOTE',
            status: data.status ?? 'DRAFT',
            folder: data.folder,
            tags: data.tags ? JSON.stringify(data.tags) : null,
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          },
        })
      },
      'createDocument'
    )
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<Document | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.document.findUnique({
          where: { id },
        })
      },
      'findDocumentById'
    )
  }

  /**
   * Find document by ID with citations
   */
  async findByIdWithCitations(id: string): Promise<Document & { citations: unknown[] } | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.document.findUnique({
          where: { id },
          include: {
            citations: {
              include: {
                reference: true,
              },
            },
          },
        }) as Document & { citations: unknown[] } | null
      },
      'findDocumentByIdWithCitations'
    )
  }

  /**
   * Update document
   */
  async update(id: string, data: UpdateDocumentData): Promise<Document> {
    return this.withRetry(
      async () => {
        const updateData: Prisma.DocumentUpdateInput = {}

        if (data.title !== undefined) updateData.title = data.title
        if (data.content !== undefined) updateData.content = data.content
        if (data.type !== undefined) updateData.type = data.type
        if (data.status !== undefined) updateData.status = data.status
        if (data.folder !== undefined) updateData.folder = data.folder
        if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags)
        if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata)

        return await this.prisma.document.update({
          where: { id },
          data: updateData,
        })
      },
      'updateDocument'
    )
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<Document> {
    return this.withRetry(
      async () => {
        return await this.prisma.document.delete({
          where: { id },
        })
      },
      'deleteDocument'
    )
  }

  /**
   * List documents with pagination and filters
   */
  async list(
    filters?: DocumentFilters,
    pagination?: PaginationOptions
  ): Promise<PaginationResult<Document>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(pagination)

        const where: Prisma.DocumentWhereInput = {}

        if (filters?.userId) {
          where.userId = filters.userId
        }

        if (filters?.type) {
          where.type = filters.type
        }

        if (filters?.status) {
          where.status = filters.status
        }

        if (filters?.folder) {
          where.folder = filters.folder
        }

        if (filters?.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { content: { contains: filters.search, mode: 'insensitive' } },
          ]
        }

        const [data, total] = await Promise.all([
          this.prisma.document.findMany({
            where,
            skip,
            take,
            orderBy: { updatedAt: 'desc' },
          }),
          this.prisma.document.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'listDocuments'
    )
  }

  /**
   * Count documents by user
   */
  async countByUser(userId: string): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.document.count({
          where: { userId },
        })
      },
      'countDocumentsByUser'
    )
  }

  /**
   * Count documents by type
   */
  async countByType(type: DocumentType, userId?: string): Promise<number> {
    return this.withRetry(
      async () => {
        return await this.prisma.document.count({
          where: { 
            type,
            ...(userId && { userId })
          },
        })
      },
      'countDocumentsByType'
    )
  }

  /**
   * Archive document
   */
  async archive(id: string): Promise<Document> {
    return this.update(id, { status: 'ARCHIVED' })
  }
}

// Export singleton instance
export const documentRepository = new DocumentRepository()
