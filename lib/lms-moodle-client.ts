/**
 * Moodle LMS API Client
 * 
 * Implements Moodle Web Services API integration for:
 * - Course management
 * - Assignment synchronization  
 * - Gradebook integration
 * - User enrollment management
 * 
 * @see https://docs.moodle.org/dev/Web_services_API
 */

import monitoring from './monitoring'

export interface MoodleConfig {
  baseUrl: string
  token: string
}

export interface MoodleCourse {
  id: number
  shortname: string
  fullname: string
  displayname: string
  enrolledusercount?: number
  idnumber?: string
  summary?: string
  summaryformat: number
  format: string
  startdate: number
  enddate: number
}

export interface MoodleAssignment {
  id: number
  course: number
  name: string
  intro: string
  introformat: number
  duedate: number
  cutoffdate: number
  allowsubmissionsfromdate: number
  grade: number
  timemodified: number
  completionsubmit: number
  requiresubmissionstatement: number
}

export interface MoodleGrade {
  itemid: number
  itemname: string
  itemtype: string
  itemmodule: string
  userid: number
  rawgrade: number | null
  percentageformatted: string
  feedback: string | null
  gradedatesubmitted: number
  gradedategraded: number
}

export interface MoodleUser {
  id: number
  username: string
  firstname: string
  lastname: string
  fullname: string
  email: string
  department?: string
  institution?: string
  idnumber?: string
  firstaccess: number
  lastaccess: number
}

export interface MoodleEnrollment {
  id: number
  userid: number
  courseid: number
  roleid: number
  timestart: number
  timeend: number
  timecreated: number
  timemodified: number
}

// Internal Moodle API response types
interface MoodleCourseSection {
  modules?: MoodleCourseModule[]
  [key: string]: unknown
}

interface MoodleCourseModule {
  id: number
  name: string
  modname: string
  [key: string]: unknown
}

/**
 * Moodle LMS API client
 */
export class MoodleClient {
  private config: MoodleConfig

  constructor(config: MoodleConfig) {
    this.config = config
  }

  /**
   * Make API request to Moodle
   */
  private async request<T>(
    functionName: string,
    params: Record<string, string | number | boolean> = {}
  ): Promise<T> {
    const url = new URL(`${this.config.baseUrl}/webservice/rest/server.php`)
    url.searchParams.append('wstoken', this.config.token)
    url.searchParams.append('wsfunction', functionName)
    url.searchParams.append('moodlewsrestformat', 'json')

    // Add parameters
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === 'object') {
            Object.entries(item).forEach(([subKey, subValue]) => {
              url.searchParams.append(`${key}[${index}][${subKey}]`, String(subValue))
            })
          } else {
            url.searchParams.append(`${key}[${index}]`, String(item))
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([subKey, subValue]) => {
          url.searchParams.append(`${key}[${subKey}]`, String(subValue))
        })
      } else {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error(`Moodle API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Check for Moodle-specific errors
    if (data.exception) {
      throw new Error(`Moodle error: ${data.message || data.exception}`)
    }

    return data
  }

  /**
   * Get all courses the user has access to
   */
  async getCourses(): Promise<MoodleCourse[]> {
    const startTime = Date.now()

    try {
      const courses = await this.request<MoodleCourse[]>('core_course_get_courses')

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_courses',
        count: courses.length.toString(),
      })

      return courses
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_courses',
      })
      throw error
    }
  }

  /**
   * Get course by ID
   */
  async getCourse(courseId: number): Promise<MoodleCourse> {
    const startTime = Date.now()

    try {
      const courses = await this.request<{ courses: MoodleCourse[] }>(
        'core_course_get_courses',
        {
          options: {
            ids: [courseId],
          },
        }
      )

      if (!courses.courses || courses.courses.length === 0) {
        throw new Error(`Course ${courseId} not found`)
      }

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_course',
      })

      return courses.courses[0]
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_course',
        courseId: courseId.toString(),
      })
      throw error
    }
  }

  /**
   * Get assignments for a course
   */
  async getAssignments(courseId: number): Promise<MoodleAssignment[]> {
    const startTime = Date.now()

    try {
      const response = await this.request<{ courses: Array<{ id: number; assignments: MoodleAssignment[] }> }>(
        'mod_assign_get_assignments',
        {
          courseids: [courseId],
        }
      )

      const assignments = response.courses[0]?.assignments || []

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_assignments',
        count: assignments.length.toString(),
      })

      return assignments
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_assignments',
        courseId: courseId.toString(),
      })
      throw error
    }
  }

  /**
   * Get enrolled users in a course
   */
  async getEnrollments(courseId: number): Promise<MoodleUser[]> {
    const startTime = Date.now()

    try {
      const users = await this.request<MoodleUser[]>(
        'core_enrol_get_enrolled_users',
        {
          courseid: courseId,
        }
      )

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_enrollments',
        count: users.length.toString(),
      })

      return users
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_enrollments',
        courseId: courseId.toString(),
      })
      throw error
    }
  }

  /**
   * Get user details
   */
  async getUser(userId: number): Promise<MoodleUser> {
    const startTime = Date.now()

    try {
      const users = await this.request<MoodleUser[]>(
        'core_user_get_users_by_field',
        {
          field: 'id',
          values: [userId],
        }
      )

      if (!users || users.length === 0) {
        throw new Error(`User ${userId} not found`)
      }

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_user',
      })

      return users[0]
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_user',
        userId: userId.toString(),
      })
      throw error
    }
  }

  /**
   * Submit grade for an assignment
   */
  async submitGrade(
    assignmentId: number,
    userId: number,
    grade: {
      score: number
      feedback?: string
    }
  ): Promise<void> {
    const startTime = Date.now()

    try {
      await this.request('mod_assign_save_grade', {
        assignmentid: assignmentId,
        userid: userId,
        grade: grade.score,
        attemptnumber: -1, // Latest attempt
        addattempt: 0,
        workflowstate: '',
        applytoall: 0,
        plugindata: {
          assignfeedbackcomments_editor: {
            text: grade.feedback || '',
            format: 1,
          },
        },
      })

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'submit_grade',
      })
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'submit_grade',
        assignmentId: assignmentId.toString(),
        userId: userId.toString(),
      })
      throw error
    }
  }

  /**
   * Get grades for an assignment
   */
  async getGrades(assignmentId: number): Promise<MoodleGrade[]> {
    const startTime = Date.now()

    try {
      const response = await this.request<{ assignments: Array<{ grades: MoodleGrade[] }> }>(
        'mod_assign_get_grades',
        {
          assignmentids: [assignmentId],
        }
      )

      const grades = response.assignments[0]?.grades || []

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_grades',
        count: grades.length.toString(),
      })

      return grades
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_grades',
        assignmentId: assignmentId.toString(),
      })
      throw error
    }
  }

  /**
   * Get course gradebook
   */
  async getGradebook(courseId: number): Promise<MoodleGrade[]> {
    const startTime = Date.now()

    try {
      const response = await this.request<{ usergrades: Array<{ gradeitems: MoodleGrade[] }> }>(
        'gradereport_user_get_grade_items',
        {
          courseid: courseId,
        }
      )

      const allGrades: MoodleGrade[] = []
      response.usergrades.forEach((usergrade) => {
        allGrades.push(...usergrade.gradeitems)
      })

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_gradebook',
        count: allGrades.length.toString(),
      })

      return allGrades
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_gradebook',
        courseId: courseId.toString(),
      })
      throw error
    }
  }

  /**
   * Create a new assignment in a course
   * Note: Moodle doesn't provide a standard web service for creating assignments.
   * This requires custom web service implementation or administrator database access.
   * @throws Error indicating the operation is not supported
   */
  async createAssignment(
    _courseId: number,
    _assignment: {
      name: string
      intro: string
      duedate?: number
      cutoffdate?: number
      grade: number
    }
  ): Promise<never> {
    try {
      // Note: Moodle doesn't have a direct web service for creating assignments
      // This would typically require a custom web service or database access
      // For now, we'll throw a not implemented error
      throw new Error('Assignment creation requires custom Moodle web service or administrator access')
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'create_assignment',
        courseId: courseId.toString(),
      })
      throw error
    }
  }

  /**
   * Get course modules/activities
   */
  async getCourseModules(courseId: number): Promise<MoodleCourseModule[]> {
    const startTime = Date.now()

    try {
      const response = await this.request<MoodleCourseSection[]>(
        'core_course_get_contents',
        {
          courseid: courseId,
        }
      )

      const modules: MoodleCourseModule[] = []
      response.forEach((section) => {
        if (section.modules) {
          modules.push(...section.modules)
        }
      })

      monitoring.trackMetric('lms_api_call', Date.now() - startTime, {
        provider: 'moodle',
        operation: 'get_course_modules',
        count: modules.length.toString(),
      })

      return modules
    } catch (error) {
      monitoring.trackError(error as Error, {
        provider: 'moodle',
        operation: 'get_course_modules',
        courseId: courseId.toString(),
      })
      throw error
    }
  }
}

/**
 * Create Moodle client from environment variables
 */
export function createMoodleClient(): MoodleClient | null {
  const baseUrl = process.env.MOODLE_BASE_URL
  const token = process.env.MOODLE_TOKEN

  if (!baseUrl || !token) {
    console.warn('Moodle LMS credentials not configured')
    return null
  }

  return new MoodleClient({
    baseUrl,
    token,
  })
}
