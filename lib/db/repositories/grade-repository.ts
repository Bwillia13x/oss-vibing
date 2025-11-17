/**
 * Grade Repository
 * 
 * Handles all grade-related database operations
 */

import { Grade, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateGradeData {
  submissionId: string
  instructorId: string
  score: number
  maxPoints: number
  feedback?: Record<string, unknown>
  rubricScores?: Record<string, unknown>
}

export interface UpdateGradeData {
  score?: number
  maxPoints?: number
  feedback?: Record<string, unknown>
  rubricScores?: Record<string, unknown>
}

export interface GradeFilters {
  instructorId?: string
  submissionId?: string
}

export class GradeRepository extends BaseRepository {
  /**
   * Create a new grade
   */
  async create(data: CreateGradeData): Promise<Grade> {
    return this.withRetry(
      async () => {
        return await this.prisma.grade.create({
          data: {
            submissionId: data.submissionId,
            instructorId: data.instructorId,
            score: data.score,
            maxPoints: data.maxPoints,
            feedback: data.feedback ? JSON.stringify(data.feedback) : null,
            rubricScores: data.rubricScores ? JSON.stringify(data.rubricScores) : null,
          },
        })
      },
      'createGrade'
    )
  }

  /**
   * Find grade by ID
   */
  async findById(id: string): Promise<Grade | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.grade.findUnique({
          where: { id },
        })
      },
      'findGradeById'
    )
  }

  /**
   * Find grade by submission ID
   */
  async findBySubmission(submissionId: string): Promise<Grade | null> {
    return this.withRetry(
      async () => {
        return await this.prisma.grade.findUnique({
          where: { submissionId },
        })
      },
      'findGradeBySubmission'
    )
  }

  /**
   * Find grade by submission ID with submission details
   */
  async findBySubmissionWithDetails(submissionId: string) {
    return this.withRetry(
      async () => {
        return await this.prisma.grade.findUnique({
          where: { submissionId },
          include: {
            submission: {
              include: {
                assignment: true,
              },
            },
          },
        })
      },
      'findGradeBySubmissionWithDetails'
    )
  }

  /**
   * Find grades by instructor ID
   */
  async findByInstructor(
    instructorId: string,
    options?: PaginationOptions
  ): Promise<PaginationResult<Grade>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const [data, total] = await Promise.all([
          this.prisma.grade.findMany({
            where: { instructorId },
            skip,
            take,
            orderBy: { gradedAt: 'desc' },
            include: {
              submission: true,
            },
          }),
          this.prisma.grade.count({
            where: { instructorId },
          }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'findGradesByInstructor'
    )
  }

  /**
   * Find all grades with filters
   */
  async findMany(
    filters?: GradeFilters,
    options?: PaginationOptions
  ): Promise<PaginationResult<Grade>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const where: Prisma.GradeWhereInput = {}
        if (filters?.instructorId) where.instructorId = filters.instructorId
        if (filters?.submissionId) where.submissionId = filters.submissionId

        const [data, total] = await Promise.all([
          this.prisma.grade.findMany({
            where,
            skip,
            take,
            orderBy: { gradedAt: 'desc' },
          }),
          this.prisma.grade.count({ where }),
        ])

        return this.buildPaginationResult(data, total, page, perPage)
      },
      'findManyGrades'
    )
  }

  /**
   * Update a grade
   */
  async update(id: string, data: UpdateGradeData): Promise<Grade> {
    return this.withRetry(
      async () => {
        const updateData: Prisma.GradeUpdateInput = {}
        if (data.score !== undefined) updateData.score = data.score
        if (data.maxPoints !== undefined) updateData.maxPoints = data.maxPoints
        if (data.feedback !== undefined) updateData.feedback = JSON.stringify(data.feedback)
        if (data.rubricScores !== undefined) updateData.rubricScores = JSON.stringify(data.rubricScores)

        return await this.prisma.grade.update({
          where: { id },
          data: updateData,
        })
      },
      'updateGrade'
    )
  }

  /**
   * Update feedback for a grade
   */
  async updateFeedback(gradeId: string, feedback: Record<string, unknown>): Promise<Grade> {
    return this.withRetry(
      async () => {
        return await this.prisma.grade.update({
          where: { id: gradeId },
          data: { feedback: JSON.stringify(feedback) },
        })
      },
      'updateGradeFeedback'
    )
  }

  /**
   * Delete a grade
   */
  async delete(id: string): Promise<void> {
    return this.withRetry(
      async () => {
        await this.prisma.grade.delete({
          where: { id },
        })
      },
      'deleteGrade'
    )
  }
}
