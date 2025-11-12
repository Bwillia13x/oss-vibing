/**
 * Canvas LMS API Client
 * 
 * Basic implementation for Canvas LMS integration.
 * Supports assignment import, submission, and grade sync.
 * 
 * Note: This is a Phase 2 implementation focused on core functionality.
 * Future phases will add:
 * - Blackboard and Moodle support
 * - Course material import
 * - Advanced calendar sync
 * - Instructor dashboard features
 */

export interface CanvasConfig {
  baseUrl: string // e.g., "https://canvas.instructure.com"
  accessToken: string
  courseId?: string
}

export interface Assignment {
  id: string
  name: string
  description: string
  dueAt: string | null
  pointsPossible: number
  submissionTypes: string[]
  courseId: string
  courseName?: string
}

export interface Submission {
  id: string
  assignmentId: string
  userId: string
  submittedAt: string | null
  score: number | null
  grade: string | null
  submissionType: string
  body?: string
  url?: string
}

export interface Course {
  id: string
  name: string
  courseCode: string
  enrollmentTermId: string
}

/**
 * Canvas LMS API client
 */
export class CanvasClient {
  private baseUrl: string
  private accessToken: string
  private courseId?: string

  constructor(config: CanvasConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.accessToken = config.accessToken
    this.courseId = config.courseId
  }

  /**
   * Make API request to Canvas
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`Canvas API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get user's enrolled courses
   */
  async getCourses(): Promise<Course[]> {
    return this.request<Course[]>('/courses?enrollment_state=active')
  }

  /**
   * Get assignments for a course
   */
  async getAssignments(courseId?: string): Promise<Assignment[]> {
    const cid = courseId || this.courseId
    if (!cid) {
      throw new Error('Course ID is required')
    }

    const assignments = await this.request<any[]>(
      `/courses/${cid}/assignments?per_page=100`
    )

    return assignments.map(a => ({
      id: String(a.id),
      name: a.name,
      description: a.description || '',
      dueAt: a.due_at,
      pointsPossible: a.points_possible || 0,
      submissionTypes: a.submission_types || [],
      courseId: cid,
    }))
  }

  /**
   * Get a specific assignment
   */
  async getAssignment(assignmentId: string, courseId?: string): Promise<Assignment> {
    const cid = courseId || this.courseId
    if (!cid) {
      throw new Error('Course ID is required')
    }

    const assignment = await this.request<any>(
      `/courses/${cid}/assignments/${assignmentId}`
    )

    return {
      id: String(assignment.id),
      name: assignment.name,
      description: assignment.description || '',
      dueAt: assignment.due_at,
      pointsPossible: assignment.points_possible || 0,
      submissionTypes: assignment.submission_types || [],
      courseId: cid,
    }
  }

  /**
   * Submit an assignment
   * 
   * @param assignmentId - Canvas assignment ID
   * @param submission - Submission data
   * @param courseId - Optional course ID (uses default if not provided)
   */
  async submitAssignment(
    assignmentId: string,
    submission: {
      submissionType: 'online_text_entry' | 'online_url' | 'online_upload'
      body?: string
      url?: string
      fileIds?: string[]
    },
    courseId?: string
  ): Promise<Submission> {
    const cid = courseId || this.courseId
    if (!cid) {
      throw new Error('Course ID is required')
    }

    const data: any = {
      submission: {
        submission_type: submission.submissionType,
      },
    }

    if (submission.body) {
      data.submission.body = submission.body
    }
    if (submission.url) {
      data.submission.url = submission.url
    }
    if (submission.fileIds) {
      data.submission.file_ids = submission.fileIds
    }

    const result = await this.request<any>(
      `/courses/${cid}/assignments/${assignmentId}/submissions`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )

    return {
      id: String(result.id),
      assignmentId: String(result.assignment_id),
      userId: String(result.user_id),
      submittedAt: result.submitted_at,
      score: result.score,
      grade: result.grade,
      submissionType: result.submission_type,
      body: result.body,
      url: result.url,
    }
  }

  /**
   * Get submission for an assignment
   */
  async getSubmission(assignmentId: string, userId: string = 'self', courseId?: string): Promise<Submission> {
    const cid = courseId || this.courseId
    if (!cid) {
      throw new Error('Course ID is required')
    }

    const result = await this.request<any>(
      `/courses/${cid}/assignments/${assignmentId}/submissions/${userId}`
    )

    return {
      id: String(result.id),
      assignmentId: String(result.assignment_id),
      userId: String(result.user_id),
      submittedAt: result.submitted_at,
      score: result.score,
      grade: result.grade,
      submissionType: result.submission_type,
      body: result.body,
      url: result.url,
    }
  }

  /**
   * Get upcoming assignments (within next 30 days)
   */
  async getUpcomingAssignments(courseId?: string): Promise<Assignment[]> {
    const assignments = await this.getAssignments(courseId)
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return assignments.filter(a => {
      if (!a.dueAt) return false
      const dueDate = new Date(a.dueAt)
      return dueDate >= now && dueDate <= thirtyDaysFromNow
    }).sort((a, b) => {
      const aDate = new Date(a.dueAt!).getTime()
      const bDate = new Date(b.dueAt!).getTime()
      return aDate - bDate
    })
  }

  /**
   * Import assignment to Vibe University format
   * 
   * Creates a task document with assignment details
   */
  async importAssignment(assignmentId: string, courseId?: string): Promise<{
    assignment: Assignment
    taskPath: string
    content: string
  }> {
    const assignment = await this.getAssignment(assignmentId, courseId)
    
    // Generate task content in markdown format
    const content = this.generateTaskContent(assignment)
    
    // Generate file path
    const sanitizedName = assignment.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    
    const taskPath = `tasks/${sanitizedName}-${assignment.id}.md`
    
    return {
      assignment,
      taskPath,
      content,
    }
  }

  /**
   * Generate task document content from assignment
   */
  private generateTaskContent(assignment: Assignment): string {
    const dueDate = assignment.dueAt 
      ? new Date(assignment.dueAt).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'No due date'

    return `# ${assignment.name}

**Course:** ${assignment.courseName || 'Canvas Course'}  
**Due:** ${dueDate}  
**Points:** ${assignment.pointsPossible}  
**Submission Types:** ${assignment.submissionTypes.join(', ')}

## Description

${assignment.description || 'No description provided.'}

## Work Area

<!-- Start your work below this line -->

---

## Notes

- Assignment imported from Canvas LMS
- Assignment ID: ${assignment.id}
- Course ID: ${assignment.courseId}
- Use \`lmsSync\` tool to submit your completed work
`
  }

  /**
   * Get assignment metadata for submission
   */
  getAssignmentMetadata(assignmentId: string, courseId?: string): {
    assignmentId: string
    courseId: string
  } {
    const cid = courseId || this.courseId
    if (!cid) {
      throw new Error('Course ID is required')
    }

    return {
      assignmentId,
      courseId: cid,
    }
  }
}

/**
 * Create Canvas client from config
 */
export function createCanvasClient(config: CanvasConfig): CanvasClient {
  return new CanvasClient(config)
}

/**
 * Parse Canvas config from environment or user settings
 */
export function getCanvasConfig(): CanvasConfig | null {
  // In production, this would read from user settings or environment
  // For Phase 2, we return a stub configuration
  const baseUrl = process.env.CANVAS_BASE_URL
  const accessToken = process.env.CANVAS_ACCESS_TOKEN
  const courseId = process.env.CANVAS_COURSE_ID

  if (!baseUrl || !accessToken) {
    return null
  }

  return {
    baseUrl,
    accessToken,
    courseId,
  }
}
