/**
 * Document Repository
 * 
 * Handles all document-related database operations
 */

import { Document, DocumentType, DocumentStatus, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface DocumentCitation {
  id: string
  doi?: string
  title?: string
  authors?: string[]
  year?: number
  journal?: string
}

export interface CollaborativeState {
  users: string[]
  version: number
  [key: string]: unknown
}

export interface CreateDocumentData {
  userId: string
  title: string
  content: string
  type?: DocumentType
  status?: DocumentStatus
  folder?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  // Optional in-memory fields used by some E2E tests
  citations?: DocumentCitation[]
  collaborativeState?: CollaborativeState
}

export interface UpdateDocumentData {
  title?: string
  content?: string
  type?: DocumentType
  status?: DocumentStatus
  folder?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  // Optional in-memory fields used by some E2E tests
  citations?: DocumentCitation[]
  collaborativeState?: CollaborativeState
}

export interface DocumentFilters {
  userId?: string
  type?: DocumentType
  status?: DocumentStatus
  folder?: string
  search?: string
}

// Extended Document type with parsed JSON fields
export type DocumentWithParsedFields = Omit<Document, 'tags' | 'metadata'> & {
  tags: string[] | null
  metadata: Record<string, unknown> | null
  citations?: DocumentCitation[]
  collaborativeState?: CollaborativeState | null
}

export class DocumentRepository extends BaseRepository {
  /**
   * Safely parse a JSON string, returning null on failure
   */
  private safeJsonParse<T = unknown>(value: string | null): T | null {
    if (!value) return null
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  /**
   * Parse JSON fields in a document
   */
  private parseDocument(doc: Document): DocumentWithParsedFields {
    return {
      ...doc,
      tags: this.safeJsonParse<string[]>(doc.tags),
      metadata: this.safeJsonParse<Record<string, unknown>>(doc.metadata),
    }
  }

  /**
   * Parse JSON fields in multiple documents
   */
  private parseDocuments(docs: Document[]): DocumentWithParsedFields[] {
    return docs.map(doc => this.parseDocument(doc))
  }
  /**
   * Create a new document
   */
  async create(data: CreateDocumentData): Promise<DocumentWithParsedFields> {
    return this.withRetry(
      async () => {
        const doc = await this.prisma.document.create({
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
        const parsed = this.parseDocument(doc)

        if (data.citations !== undefined) {
          parsed.citations = data.citations
        }

        if (data.collaborativeState !== undefined) {
          parsed.collaborativeState = data.collaborativeState
        }

        return parsed
      },
      'createDocument'
    )
  }

  /**
   * Find document by ID
   */
  async findById(id: string): Promise<DocumentWithParsedFields | null> {
    return this.withRetry(
      async () => {
        const doc = await this.prisma.document.findUnique({
          where: { id },
        })
        return doc ? this.parseDocument(doc) : null
      },
      'findDocumentById'
    )
  }

  /**
   * Find document by ID with citations
   */
  async findByIdWithCitations(id: string): Promise<DocumentWithParsedFields | null> {
    return this.withRetry(
      async () => {
        const doc = await this.prisma.document.findUnique({
          where: { id },
          include: {
            citations: {
              include: {
                reference: true,
              },
            },
          },
        })

        if (!doc) return null

        const parsed = this.parseDocument(doc)

        const rawCitations = (doc as unknown as {
          citations: Array<{
            id: string
            reference?: {
              doi?: string | null
              title?: string | null
              authors?: string | null
              year?: number | null
              journal?: string | null
            } | null
          }>
        }).citations

        parsed.citations = rawCitations.map(citation => ({
          id: citation.id,
          doi: citation.reference?.doi ?? undefined,
          title: citation.reference?.title ?? undefined,
          authors: citation.reference?.authors
            ? this.safeJsonParse<string[]>(citation.reference.authors) ?? undefined
            : undefined,
          year: citation.reference?.year ?? undefined,
          journal: citation.reference?.journal ?? undefined,
        }))

        return parsed
      },
      'findDocumentByIdWithCitations'
    )
  }

  /**
   * Update document
   */
  async update(id: string, data: UpdateDocumentData): Promise<DocumentWithParsedFields> {
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

        const doc = await this.prisma.document.update({
          where: { id },
          data: updateData,
        })
        const parsed = this.parseDocument(doc)

        if (data.citations !== undefined) {
          parsed.citations = data.citations
        }

        if (data.collaborativeState !== undefined) {
          parsed.collaborativeState = data.collaborativeState
        }

        return parsed
      },
      'updateDocument'
    )
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<DocumentWithParsedFields> {
    return this.withRetry(
      async () => {
        const doc = await this.prisma.document.delete({
          where: { id },
        })
        return this.parseDocument(doc)
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
  ): Promise<PaginationResult<DocumentWithParsedFields>> {
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
            { title: { contains: filters.search } },
            { content: { contains: filters.search } },
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

        return this.buildPaginationResult(this.parseDocuments(data), total, page, perPage)
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
   * Find documents by user ID
   */
  async findByUserId(userId: string): Promise<DocumentWithParsedFields[]> {
    return this.withRetry(
      async () => {
        const docs = await this.prisma.document.findMany({
          where: { userId },
          orderBy: { updatedAt: 'desc' },
        })
        return this.parseDocuments(docs)
      },
      'findDocumentsByUserId'
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
  async archive(id: string): Promise<DocumentWithParsedFields> {
    return this.update(id, { status: 'ARCHIVED' })
  }
}

// Export singleton instance
export const documentRepository = new DocumentRepository()
