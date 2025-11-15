/**
 * Unified LMS Interface
 * 
 * Provides a unified interface to work with multiple LMS providers:
 * - Canvas
 * - Blackboard Learn
 * - Moodle
 * 
 * Automatically detects and uses the configured LMS provider.
 */

import { CanvasClient, createCanvasClient, type CanvasCourse, type CanvasAssignment } from './lms-canvas-client'
import { BlackboardClient, createBlackboardClient, type BlackboardCourse, type BlackboardAssignment } from './lms-blackboard-client'
import { MoodleClient, createMoodleClient, type MoodleCourse, type MoodleAssignment } from './lms-moodle-client'

export type LMSProvider = 'canvas' | 'blackboard' | 'moodle'

export interface UnifiedCourse {
  id: string
  name: string
  code: string
  description?: string
  startDate?: string
  endDate?: string
  enrollmentCount?: number
  provider: LMSProvider
}

export interface UnifiedAssignment {
  id: string
  courseId: string
  name: string
  description?: string
  dueDate?: string
  pointsPossible: number
  provider: LMSProvider
}

export interface UnifiedGrade {
  userId: string
  assignmentId: string
  score: number
  maxScore: number
  feedback?: string
  submittedAt?: string
  gradedAt?: string
  provider: LMSProvider
}

export interface UnifiedUser {
  id: string
  name: string
  email: string
  username?: string
  provider: LMSProvider
}

/**
 * Unified LMS Manager
 */
export class LMSManager {
  private canvasClient: CanvasClient | null = null
  private blackboardClient: BlackboardClient | null = null
  private moodleClient: MoodleClient | null = null
  private provider: LMSProvider | null = null

  constructor() {
    // Initialize available clients
    this.canvasClient = createCanvasClient()
    this.blackboardClient = createBlackboardClient()
    this.moodleClient = createMoodleClient()

    // Determine which provider to use
    if (this.canvasClient) {
      this.provider = 'canvas'
    } else if (this.blackboardClient) {
      this.provider = 'blackboard'
    } else if (this.moodleClient) {
      this.provider = 'moodle'
    }
  }

  /**
   * Get the active LMS provider
   */
  getProvider(): LMSProvider | null {
    return this.provider
  }

  /**
   * Check if an LMS is configured
   */
  isConfigured(): boolean {
    return this.provider !== null
  }

  /**
   * Get all courses
   */
  async getCourses(): Promise<UnifiedCourse[]> {
    if (!this.provider) {
      throw new Error('No LMS provider configured')
    }

    switch (this.provider) {
      case 'canvas':
        return this.getCanvasCourses()
      case 'blackboard':
        return this.getBlackboardCourses()
      case 'moodle':
        return this.getMoodleCourses()
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<UnifiedCourse> {
    if (!this.provider) {
      throw new Error('No LMS provider configured')
    }

    switch (this.provider) {
      case 'canvas':
        return this.getCanvasCourse(courseId)
      case 'blackboard':
        return this.getBlackboardCourse(courseId)
      case 'moodle':
        return this.getMoodleCourse(courseId)
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  /**
   * Get assignments for a course
   */
  async getAssignments(courseId: string): Promise<UnifiedAssignment[]> {
    if (!this.provider) {
      throw new Error('No LMS provider configured')
    }

    switch (this.provider) {
      case 'canvas':
        return this.getCanvasAssignments(courseId)
      case 'blackboard':
        return this.getBlackboardAssignments(courseId)
      case 'moodle':
        return this.getMoodleAssignments(courseId)
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  /**
   * Submit grade for an assignment
   */
  async submitGrade(
    courseId: string,
    assignmentId: string,
    userId: string,
    grade: {
      score: number
      feedback?: string
    }
  ): Promise<void> {
    if (!this.provider) {
      throw new Error('No LMS provider configured')
    }

    switch (this.provider) {
      case 'canvas':
        await this.canvasClient!.submitGrade(courseId, assignmentId, userId, {
          posted_grade: grade.score,
          comment: grade.feedback,
        })
        break
      case 'blackboard':
        await this.blackboardClient!.submitGrade(courseId, assignmentId, userId, {
          score: grade.score,
          feedback: grade.feedback,
          exempt: false,
        })
        break
      case 'moodle':
        await this.moodleClient!.submitGrade(parseInt(assignmentId), parseInt(userId), grade)
        break
      default:
        throw new Error(`Unknown provider: ${this.provider}`)
    }
  }

  // Canvas-specific implementations
  private async getCanvasCourses(): Promise<UnifiedCourse[]> {
    const courses = await this.canvasClient!.getCourses()
    return courses.map((course: CanvasCourse) => ({
      id: course.id.toString(),
      name: course.name,
      code: course.course_code,
      description: course.public_description,
      startDate: course.start_at,
      endDate: course.end_at,
      enrollmentCount: course.total_students,
      provider: 'canvas' as const,
    }))
  }

  private async getCanvasCourse(courseId: string): Promise<UnifiedCourse> {
    const course = await this.canvasClient!.getCourse(parseInt(courseId))
    return {
      id: course.id.toString(),
      name: course.name,
      code: course.course_code,
      description: course.public_description,
      startDate: course.start_at,
      endDate: course.end_at,
      enrollmentCount: course.total_students,
      provider: 'canvas',
    }
  }

  private async getCanvasAssignments(courseId: string): Promise<UnifiedAssignment[]> {
    const assignments = await this.canvasClient!.getAssignments(parseInt(courseId))
    return assignments.map((assignment: CanvasAssignment) => ({
      id: assignment.id.toString(),
      courseId: courseId,
      name: assignment.name,
      description: assignment.description,
      dueDate: assignment.due_at,
      pointsPossible: assignment.points_possible,
      provider: 'canvas' as const,
    }))
  }

  // Blackboard-specific implementations
  private async getBlackboardCourses(): Promise<UnifiedCourse[]> {
    const courses = await this.blackboardClient!.getCourses()
    return courses.map((course: BlackboardCourse) => ({
      id: course.id,
      name: course.name,
      code: course.courseId,
      description: course.description,
      startDate: course.created,
      endDate: course.modified,
      enrollmentCount: course.enrollmentTotal,
      provider: 'blackboard' as const,
    }))
  }

  private async getBlackboardCourse(courseId: string): Promise<UnifiedCourse> {
    const course = await this.blackboardClient!.getCourse(courseId)
    return {
      id: course.id,
      name: course.name,
      code: course.courseId,
      description: course.description,
      startDate: course.created,
      endDate: course.modified,
      enrollmentCount: course.enrollmentTotal,
      provider: 'blackboard',
    }
  }

  private async getBlackboardAssignments(courseId: string): Promise<UnifiedAssignment[]> {
    const assignments = await this.blackboardClient!.getAssignments(courseId)
    return assignments.map((assignment: BlackboardAssignment) => ({
      id: assignment.id,
      courseId: courseId,
      name: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      pointsPossible: assignment.pointsPossible,
      provider: 'blackboard' as const,
    }))
  }

  // Moodle-specific implementations
  private async getMoodleCourses(): Promise<UnifiedCourse[]> {
    const courses = await this.moodleClient!.getCourses()
    return courses.map((course: MoodleCourse) => ({
      id: course.id.toString(),
      name: course.fullname,
      code: course.shortname,
      description: course.summary,
      startDate: new Date(course.startdate * 1000).toISOString(),
      endDate: course.enddate ? new Date(course.enddate * 1000).toISOString() : undefined,
      enrollmentCount: course.enrolledusercount,
      provider: 'moodle' as const,
    }))
  }

  private async getMoodleCourse(courseId: string): Promise<UnifiedCourse> {
    const course = await this.moodleClient!.getCourse(parseInt(courseId))
    return {
      id: course.id.toString(),
      name: course.fullname,
      code: course.shortname,
      description: course.summary,
      startDate: new Date(course.startdate * 1000).toISOString(),
      endDate: course.enddate ? new Date(course.enddate * 1000).toISOString() : undefined,
      enrollmentCount: course.enrolledusercount,
      provider: 'moodle',
    }
  }

  private async getMoodleAssignments(courseId: string): Promise<UnifiedAssignment[]> {
    const assignments = await this.moodleClient!.getAssignments(parseInt(courseId))
    return assignments.map((assignment: MoodleAssignment) => ({
      id: assignment.id.toString(),
      courseId: courseId,
      name: assignment.name,
      description: assignment.intro,
      dueDate: assignment.duedate ? new Date(assignment.duedate * 1000).toISOString() : undefined,
      pointsPossible: assignment.grade,
      provider: 'moodle' as const,
    }))
  }
}

/**
 * Create LMS manager instance
 */
export function createLMSManager(): LMSManager {
  return new LMSManager()
}

/**
 * Get active LMS provider name
 */
export function getActiveLMSProvider(): LMSProvider | null {
  const manager = createLMSManager()
  return manager.getProvider()
}
