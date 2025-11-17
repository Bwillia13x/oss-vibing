/**
 * Assignment Repository
 * 
 * Handles all assignment-related database operations
 */

import { Assignment, Prisma } from '@prisma/client'
import { BaseRepository, PaginationOptions, PaginationResult } from './base-repository'

export interface CreateAssignmentData {
  title: string
  description?: string
  courseId?: string
  instructorId: string
  dueDate: Date
  maxPoints: number
  rubric?: Record<string, unknown>
  requirements?: Record<string, unknown>
  published?: boolean
}

export interface UpdateAssignmentData {
  title?: string
  description?: string
  courseId?: string
  dueDate?: Date
  maxPoints?: number
  rubric?: Record<string, unknown>
  requirements?: Record<string, unknown>
  published?: boolean
}

export interface AssignmentFilters {
  instructorId?: string
  courseId?: string
  published?: boolean
}

// Extended Assignment type with parsed JSON fields
export type AssignmentWithParsedFields = Omit<Assignment, 'rubric' | 'requirements'> & {
  rubric: Record<string, unknown> | null
  requirements: Record<string, unknown> | null
}

export class AssignmentRepository extends BaseRepository {
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
   * Parse JSON fields in an assignment
   */
  private parseAssignment(assignment: Assignment): AssignmentWithParsedFields {
    return {
      ...assignment,
      rubric: this.safeJsonParse<Record<string, unknown>>(assignment.rubric),
      requirements: this.safeJsonParse<Record<string, unknown>>(assignment.requirements),
    }
  }

  /**
   * Parse JSON fields in multiple assignments
   */
  private parseAssignments(assignments: Assignment[]): AssignmentWithParsedFields[] {
    return assignments.map(assignment => this.parseAssignment(assignment))
  }
  /**
   * Create a new assignment
   */
  async create(data: CreateAssignmentData): Promise<AssignmentWithParsedFields> {
    return this.withRetry(
      async () => {
        const assignment = await this.prisma.assignment.create({
          data: {
            title: data.title,
            description: data.description,
            courseId: data.courseId,
            instructorId: data.instructorId,
            dueDate: data.dueDate,
            maxPoints: data.maxPoints,
            rubric: data.rubric ? JSON.stringify(data.rubric) : null,
            requirements: data.requirements ? JSON.stringify(data.requirements) : null,
            published: data.published ?? false,
          },
        })
        return this.parseAssignment(assignment)
      },
      'createAssignment'
    )
  }

  /**
   * Find assignment by ID
   */
  async findById(id: string): Promise<AssignmentWithParsedFields | null> {
    return this.withRetry(
      async () => {
        const assignment = await this.prisma.assignment.findUnique({
          where: { id },
        })
        return assignment ? this.parseAssignment(assignment) : null
      },
      'findAssignmentById'
    )
  }

  /**
   * Find assignment by ID with submissions
   */
  async findByIdWithSubmissions(id: string) {
    return this.withRetry(
      async () => {
        return await this.prisma.assignment.findUnique({
          where: { id },
          include: {
            submissions: {
              include: {
                grade: true,
              },
            },
          },
        })
      },
      'findAssignmentByIdWithSubmissions'
    )
  }

  /**
   * Find assignments by course ID
   */
  async findByCourse(
    courseId: string,
    options?: PaginationOptions
  ): Promise<PaginationResult<AssignmentWithParsedFields>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const [data, total] = await Promise.all([
          this.prisma.assignment.findMany({
            where: { courseId },
            skip,
            take,
            orderBy: { dueDate: 'desc' },
          }),
          this.prisma.assignment.count({
            where: { courseId },
          }),
        ])

        return this.buildPaginationResult(this.parseAssignments(data), total, page, perPage)
      },
      'findAssignmentsByCourse'
    )
  }

  /**
   * Find assignments by instructor ID
   */
  async findByInstructor(
    instructorId: string,
    options?: PaginationOptions
  ): Promise<PaginationResult<AssignmentWithParsedFields>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const [data, total] = await Promise.all([
          this.prisma.assignment.findMany({
            where: { instructorId },
            skip,
            take,
            orderBy: { dueDate: 'desc' },
          }),
          this.prisma.assignment.count({
            where: { instructorId },
          }),
        ])

        return this.buildPaginationResult(this.parseAssignments(data), total, page, perPage)
      },
      'findAssignmentsByInstructor'
    )
  }

  /**
   * Find all assignments with filters
   */
  async findMany(
    filters?: AssignmentFilters,
    options?: PaginationOptions
  ): Promise<PaginationResult<AssignmentWithParsedFields>> {
    return this.withRetry(
      async () => {
        const { skip, take, page, perPage } = this.buildPagination(options)

        const where: Prisma.AssignmentWhereInput = {}
        if (filters?.instructorId) where.instructorId = filters.instructorId
        if (filters?.courseId) where.courseId = filters.courseId
        if (filters?.published !== undefined) where.published = filters.published

        const [data, total] = await Promise.all([
          this.prisma.assignment.findMany({
            where,
            skip,
            take,
            orderBy: { dueDate: 'desc' },
          }),
          this.prisma.assignment.count({ where }),
        ])

        return this.buildPaginationResult(this.parseAssignments(data), total, page, perPage)
      },
      'findManyAssignments'
    )
  }

  /**
   * Update an assignment
   */
  async update(id: string, data: UpdateAssignmentData): Promise<AssignmentWithParsedFields> {
    return this.withRetry(
      async () => {
        const updateData: Prisma.AssignmentUpdateInput = {}
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.courseId !== undefined) updateData.courseId = data.courseId
        if (data.dueDate !== undefined) updateData.dueDate = data.dueDate
        if (data.maxPoints !== undefined) updateData.maxPoints = data.maxPoints
        if (data.rubric !== undefined) updateData.rubric = JSON.stringify(data.rubric)
        if (data.requirements !== undefined) updateData.requirements = JSON.stringify(data.requirements)
        if (data.published !== undefined) updateData.published = data.published

        const assignment = await this.prisma.assignment.update({
          where: { id },
          data: updateData,
        })
        return this.parseAssignment(assignment)
      },
      'updateAssignment'
    )
  }

  /**
   * Publish an assignment
   */
  async publish(id: string): Promise<AssignmentWithParsedFields> {
    return this.withRetry(
      async () => {
        const assignment = await this.prisma.assignment.update({
          where: { id },
          data: { published: true },
        })
        return this.parseAssignment(assignment)
      },
      'publishAssignment'
    )
  }

  /**
   * Delete an assignment
   */
  async delete(id: string): Promise<void> {
    return this.withRetry(
      async () => {
        await this.prisma.assignment.delete({
          where: { id },
        })
      },
      'deleteAssignment'
    )
  }
}
