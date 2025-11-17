/**
 * Submission Repository
 * 
 * Handles all submission-related database operations
 */

import { Submission, SubmissionStatus, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateSubmissionData {
  assignmentId: string
  studentId: string
  content: string
  status?: SubmissionStatus
  plagiarismCheck?: Record<string, unknown>
}

export interface UpdateSubmissionData {
  content?: string
  status?: SubmissionStatus
  plagiarismCheck?: Record<string, unknown>
}

export interface SubmissionFilters {
  assignmentId?: string
  studentId?: string
  status?: SubmissionStatus
}

// Extended Submission type with parsed JSON fields
export type SubmissionWithParsedFields = Omit<Submission, 'plagiarismCheck'> & {
  plagiarismCheck: Record<string, unknown> | null
}

export class SubmissionRepository extends BaseRepository {
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
   * Parse JSON fields in a submission
   */
  private parseSubmission(submission: Submission): SubmissionWithParsedFields {
    return {
      ...submission,
      plagiarismCheck: this.safeJsonParse<Record<string, unknown>>(submission.plagiarismCheck),
    }
  }

  /**
   * Parse JSON fields in multiple submissions
   */
  private parseSubmissions(submissions: Submission[]): SubmissionWithParsedFields[] {
    return submissions.map(submission => this.parseSubmission(submission))
  }
  /**
   * Create a new submission
   */
  async create(data: CreateSubmissionData): Promise<SubmissionWithParsedFields> {
    return this.withRetry(
      async () => {
        const submission = await this.prisma.submission.create({
          data: {
            assignmentId: data.assignmentId,
            studentId: data.studentId,
            content: data.content,
            status: data.status ?? 'SUBMITTED',
            plagiarismCheck: data.plagiarismCheck ? JSON.stringify(data.plagiarismCheck) : null,
          },
        })
        return this.parseSubmission(submission)
      },
      'createSubmission'
    )
  }

  /**
   * Find submission by ID
   */
  async findById(id: string): Promise<SubmissionWithParsedFields | null> {
    return this.withRetry(
      async () => {
        const submission = await this.prisma.submission.findUnique({
          where: { id },
        })
        return submission ? this.parseSubmission(submission) : null
      },
      'findSubmissionById'
    )
  }

  /**
   * Find submission by ID with grade
   */
  async findByIdWithGrade(id: string) {
    return this.withRetry(
      async () => {
        return await this.prisma.submission.findUnique({
          where: { id },
          include: {
            grade: true,
          },
        })
      },
      'findSubmissionByIdWithGrade'
    )
  }

  /**
   * Find submissions by assignment ID
   */
  async findByAssignment(
    assignmentId: string,
    options?: PaginationOptions
  ): Promise<PaginationResult<SubmissionWithParsedFields>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const [data, total] = await Promise.all([
          this.prisma.submission.findMany({
            where: { assignmentId },
            skip,
            take,
            orderBy: { submittedAt: 'desc' },
            include: {
              grade: true,
            },
          }),
          this.prisma.submission.count({
            where: { assignmentId },
          }),
        ])

        return this.buildPaginationResult(this.parseSubmissions(data), total, page, perPage)
      },
      'findSubmissionsByAssignment'
    )
  }

  /**
   * Find submissions by student ID
   */
  async findByStudent(
    studentId: string,
    options?: PaginationOptions
  ): Promise<PaginationResult<SubmissionWithParsedFields>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const [data, total] = await Promise.all([
          this.prisma.submission.findMany({
            where: { studentId },
            skip,
            take,
            orderBy: { submittedAt: 'desc' },
            include: {
              assignment: true,
              grade: true,
            },
          }),
          this.prisma.submission.count({
            where: { studentId },
          }),
        ])

        return this.buildPaginationResult(this.parseSubmissions(data), total, page, perPage)
      },
      'findSubmissionsByStudent'
    )
  }

  /**
   * Find late submissions for an assignment
   */
  async findLateSubmissions(
    assignmentId: string,
    options?: PaginationOptions
  ): Promise<PaginationResult<SubmissionWithParsedFields>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        // First get the assignment's due date
        const assignment = await this.prisma.assignment.findUnique({
          where: { id: assignmentId },
          select: { dueDate: true },
        })

        if (!assignment) {
          return this.buildPaginationResult([], 0, page, perPage)
        }

        const where: Prisma.SubmissionWhereInput = {
          assignmentId,
          submittedAt: {
            gt: assignment.dueDate,
          },
        }

        const [data, total] = await Promise.all([
          this.prisma.submission.findMany({
            where,
            skip,
            take,
            orderBy: { submittedAt: 'desc' },
          }),
          this.prisma.submission.count({ where }),
        ])

        return this.buildPaginationResult(this.parseSubmissions(data), total, page, perPage)
      },
      'findLateSubmissions'
    )
  }

  /**
   * Find all submissions with filters
   */
  async findMany(
    filters?: SubmissionFilters,
    options?: PaginationOptions
  ): Promise<PaginationResult<SubmissionWithParsedFields>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const where: Prisma.SubmissionWhereInput = {}
        if (filters?.assignmentId) where.assignmentId = filters.assignmentId
        if (filters?.studentId) where.studentId = filters.studentId
        if (filters?.status) where.status = filters.status

        const [data, total] = await Promise.all([
          this.prisma.submission.findMany({
            where,
            skip,
            take,
            orderBy: { submittedAt: 'desc' },
          }),
          this.prisma.submission.count({ where }),
        ])

        return this.buildPaginationResult(this.parseSubmissions(data), total, page, perPage)
      },
      'findManySubmissions'
    )
  }

  /**
   * Update a submission
   */
  async update(id: string, data: UpdateSubmissionData): Promise<SubmissionWithParsedFields> {
    return this.withRetry(
      async () => {
        const updateData: Prisma.SubmissionUpdateInput = {}
        if (data.content !== undefined) updateData.content = data.content
        if (data.status !== undefined) updateData.status = data.status
        if (data.plagiarismCheck !== undefined) {
          updateData.plagiarismCheck = JSON.stringify(data.plagiarismCheck)
        }

        const submission = await this.prisma.submission.update({
          where: { id },
          data: updateData,
        })
        return this.parseSubmission(submission)
      },
      'updateSubmission'
    )
  }

  /**
   * Delete a submission
   */
  async delete(id: string): Promise<void> {
    return this.withRetry(
      async () => {
        await this.prisma.submission.delete({
          where: { id },
        })
      },
      'deleteSubmission'
    )
  }
}
