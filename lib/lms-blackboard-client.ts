/**
 * Blackboard Learn LMS API Client
 * 
 * Implements Blackboard Learn REST API integration for:
 * - Course management
 * - Assignment synchronization
 * - Gradebook integration
 * - User enrollment management
 * 
 * @see https://developer.anthology.com/portal/displayApi
 */

import monitoring from './monitoring'

export interface BlackboardConfig {
  baseUrl: string
  applicationId: string
  applicationKey: string
  learnUrl: string
}

export interface BlackboardCourse {
  id: string
  courseId: string
  name: string
  description?: string
  created: string
  modified: string
  organization: boolean
  ultraStatus: 'Classic' | 'Ultra' | 'UltraPreview'
  enrollmentTotal?: number
}

export interface BlackboardAssignment {
  id: string
  title: string
  description?: string
  dueDate?: string
  pointsPossible: number
  contentId: string
  courseId: string
}

export interface BlackboardGrade {
  userId: string
  score: number
  text?: string
  feedback?: string
  gradeNotation?: string
  exempt: boolean
}

export interface BlackboardUser {
  id: string
  userName: string
  name: {
    given: string
    family: string
    title?: string
  }
  contact: {
    email: string
  }
  systemRoleIds: string[]
  availability: {
    available: 'Yes' | 'No' | 'Disabled'
  }
}

export interface BlackboardEnrollment {
  userId: string
  courseId: string
  courseRoleId: string
  availability: {
    available: 'Yes' | 'No' | 'Disabled'
  }
  created: string
}

/**
 * Blackboard Learn LMS API client
 */
export class BlackboardClient {
  private config: BlackboardConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: BlackboardConfig) {
    this.config = config
  }

  /**
   * Authenticate and get access token
   */
  private async authenticate(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/learn/api/public/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
        }),
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Blackboard authentication failed: ${response.status}`)
      }

      const data = await response.json()
      this.accessToken = data.access_token
      // Set expiry to 5 minutes before actual expiry
      this.tokenExpiry = Date.now() + (data.expires_in - 300) * 1000

      return this.accessToken
    } catch (error) {
      console.error('Blackboard authentication error:', error)
      monitoring.trackError(error as Error, {
        service: 'blackboard',
        operation: 'authenticate',
      })
      throw error
    }
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.authenticate()

    const url = `${this.config.baseUrl}/learn/api/public/v1${endpoint}`
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Blackboard API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get all courses
   */
  async getCourses(): Promise<BlackboardCourse[]> {
    const startTime = Date.now()

    try {
      const response = await this.request<{ results: BlackboardCourse[] }>(
        '/courses?organization=false&limit=100'
      )

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'get_courses',
        count: response.results.length.toString(),
      })

      return response.results
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'get_courses',
      })
      throw error
    }
  }

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<BlackboardCourse> {
    const startTime = Date.now()

    try {
      const course = await this.request<BlackboardCourse>(`/courses/${courseId}`)

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'get_course',
      })

      return course
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'get_course',
        courseId,
      })
      throw error
    }
  }

  /**
   * Get assignments for a course
   */
  async getAssignments(courseId: string): Promise<BlackboardAssignment[]> {
    const startTime = Date.now()

    try {
      // Get course contents first
      const contents = await this.request<{ results: any[] }>(
        `/courses/${courseId}/contents`
      )

      // Filter for assignments
      const assignments: BlackboardAssignment[] = []
      for (const content of contents.results) {
        if (content.contentHandler?.id === 'resource/x-bb-assignment') {
          // Get assignment details
          try {
            const assignment = await this.request<any>(
              `/courses/${courseId}/contents/${content.id}`
            )

            assignments.push({
              id: content.id,
              title: content.title,
              description: content.description,
              dueDate: assignment.availability?.duration?.end,
              pointsPossible: assignment.grading?.points || 100,
              contentId: content.id,
              courseId,
            })
          } catch (error) {
            console.warn(`Failed to get assignment details for ${content.id}:`, error)
          }
        }
      }

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'get_assignments',
        count: assignments.length.toString(),
      })

      return assignments
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'get_assignments',
        courseId,
      })
      throw error
    }
  }

  /**
   * Get enrollment for a course
   */
  async getEnrollments(courseId: string): Promise<BlackboardEnrollment[]> {
    const startTime = Date.now()

    try {
      const response = await this.request<{ results: BlackboardEnrollment[] }>(
        `/courses/${courseId}/users?limit=1000`
      )

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'get_enrollments',
        count: response.results.length.toString(),
      })

      return response.results
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'get_enrollments',
        courseId,
      })
      throw error
    }
  }

  /**
   * Get user details
   */
  async getUser(userId: string): Promise<BlackboardUser> {
    const startTime = Date.now()

    try {
      const user = await this.request<BlackboardUser>(`/users/${userId}`)

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'get_user',
      })

      return user
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'get_user',
        userId,
      })
      throw error
    }
  }

  /**
   * Submit grade for an assignment
   */
  async submitGrade(
    courseId: string,
    contentId: string,
    userId: string,
    grade: Partial<BlackboardGrade>
  ): Promise<void> {
    const startTime = Date.now()

    try {
      await this.request(
        `/courses/${courseId}/gradebook/columns/${contentId}/users/${userId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            score: grade.score,
            text: grade.text,
            notes: grade.feedback,
            exempt: grade.exempt || false,
          }),
        }
      )

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'submit_grade',
      })
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'submit_grade',
        courseId,
        contentId,
        userId,
      })
      throw error
    }
  }

  /**
   * Get grades for an assignment
   */
  async getGrades(courseId: string, contentId: string): Promise<BlackboardGrade[]> {
    const startTime = Date.now()

    try {
      const response = await this.request<{ results: any[] }>(
        `/courses/${courseId}/gradebook/columns/${contentId}/users?limit=1000`
      )

      const grades: BlackboardGrade[] = response.results.map((item) => ({
        userId: item.userId,
        score: item.score || 0,
        text: item.text,
        feedback: item.notes,
        gradeNotation: item.gradeNotation,
        exempt: item.exempt || false,
      }))

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'get_grades',
        count: grades.length.toString(),
      })

      return grades
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'get_grades',
        courseId,
        contentId,
      })
      throw error
    }
  }

  /**
   * Create a new assignment
   */
  async createAssignment(
    courseId: string,
    assignment: {
      title: string
      description?: string
      dueDate?: string
      pointsPossible: number
    }
  ): Promise<BlackboardAssignment> {
    const startTime = Date.now()

    try {
      // Create content item
      const content = await this.request<any>(`/courses/${courseId}/contents`, {
        method: 'POST',
        body: JSON.stringify({
          title: assignment.title,
          description: assignment.description,
          contentHandler: {
            id: 'resource/x-bb-assignment',
          },
          availability: {
            available: 'Yes',
            allowGuests: false,
            adaptiveRelease: {},
          },
        }),
      })

      // Set grading options
      await this.request(`/courses/${courseId}/contents/${content.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          grading: {
            due: assignment.dueDate,
            points: assignment.pointsPossible,
          },
        }),
      })

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'blackboard',
        operation: 'create_assignment',
      })

      return {
        id: content.id,
        title: content.title,
        description: content.description,
        dueDate: assignment.dueDate,
        pointsPossible: assignment.pointsPossible,
        contentId: content.id,
        courseId,
      }
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'blackboard',
        operation: 'create_assignment',
        courseId,
      })
      throw error
    }
  }
}

/**
 * Create Blackboard client from environment variables
 */
export function createBlackboardClient(): BlackboardClient | null {
  const baseUrl = process.env.BLACKBOARD_BASE_URL
  const applicationId = process.env.BLACKBOARD_APPLICATION_ID
  const applicationKey = process.env.BLACKBOARD_APPLICATION_KEY
  const learnUrl = process.env.BLACKBOARD_LEARN_URL

  if (!baseUrl || !applicationId || !applicationKey || !learnUrl) {
    console.warn('Blackboard LMS credentials not configured')
    return null
  }

  return new BlackboardClient({
    baseUrl,
    applicationId,
    applicationKey,
    learnUrl,
  })
}
