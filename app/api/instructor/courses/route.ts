/**
 * Courses API Endpoint
 * Manage courses and class analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  getCourse,
  getInstructorCourses,
  createCourse,
  getClassAnalytics
} from '@/lib/instructor-tools'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const courseId = searchParams.get('courseId')
    const instructorId = searchParams.get('instructorId')
    const analytics = searchParams.get('analytics') === 'true'
    const period = searchParams.get('period') as 'week' | 'month' | 'term' || 'week'

    // TODO: Add authentication and authorization check

    if (courseId) {
      const course = await getCourse(courseId)
      
      if (!course) {
        return NextResponse.json(
          { error: 'Course not found' },
          { status: 404 }
        )
      }

      let classAnalytics = null
      if (analytics) {
        classAnalytics = await getClassAnalytics(courseId, period)
      }

      return NextResponse.json({
        success: true,
        data: { course, analytics: classAnalytics },
      })
    }

    if (instructorId) {
      const courses = await getInstructorCourses(instructorId)
      
      return NextResponse.json({
        success: true,
        data: courses,
        count: courses.length,
      })
    }

    return NextResponse.json(
      { error: 'Either courseId or instructorId is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error retrieving courses:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/courses',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve courses'
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const courseData = await req.json()

    if (!courseData.name || !courseData.instructorId) {
      return NextResponse.json(
        { error: 'name and instructorId are required' },
        { status: 400 }
      )
    }

    // TODO: Add authentication and authorization check

    const course = await createCourse(courseData)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/instructor/courses',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: course,
      message: 'Course created successfully',
    })
  } catch (error) {
    console.error('Error creating course:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/courses',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create course'
      },
      { status: 500 }
    )
  }
}
