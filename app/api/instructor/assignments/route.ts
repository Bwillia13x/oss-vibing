/**
 * Assignments API Endpoint
 * Manage course assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createAssignment, 
  updateAssignment, 
  getCourseAssignments,
  getAssignment,
  getAssignmentStatistics
} from '@/lib/instructor-tools'
import { AssignmentRepository } from '@/lib/db/repositories'
import { createAssignmentSchema } from '@/lib/db/validation/schemas'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const _startTime = Date.now()

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
    const assignmentId = searchParams.get('assignmentId')
    const includeStats = searchParams.get('stats') === 'true'

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (assignmentId) {
      const assignment = await getAssignment(assignmentId)
      
      if (!assignment) {
        return NextResponse.json(
          { error: 'Assignment not found' },
          { status: 404 }
        )
      }

      let stats = null
      if (includeStats) {
        stats = await getAssignmentStatistics(assignmentId)
      }

      return NextResponse.json({
        success: true,
        data: { assignment, stats },
      })
    }

    if (courseId) {
      const assignments = await getCourseAssignments(courseId)
      
      return NextResponse.json({
        success: true,
        data: assignments,
        count: assignments.length,
      })
    }

    return NextResponse.json(
      { error: 'Either courseId or assignmentId is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error retrieving assignments:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/assignments',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve assignments'
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

    const assignmentData = await req.json()

    // Validate input with Zod
    const validationResult = createAssignmentSchema.safeParse(assignmentData)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const data = validationResult.data
    const assignment = await createAssignment({
      title: data.title,
      description: data.description || '',
      courseId: data.courseId || '',
      instructorId: data.instructorId,
      dueDate: new Date(data.dueDate),
      maxPoints: data.maxPoints,
      rubric: data.rubric,
      requirements: data.requirements,
      published: data.published,
    } as any)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/instructor/assignments',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating assignment:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/assignments',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create assignment'
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
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

    const { id, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Assignment id is required' },
        { status: 400 }
      )
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const assignment = await updateAssignment(id, updates)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/instructor/assignments',
      method: 'PUT',
    })

    return NextResponse.json({
      success: true,
      data: assignment,
      message: 'Assignment updated successfully',
    })
  } catch (error) {
    console.error('Error updating assignment:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/assignments',
      method: 'PUT',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update assignment'
      },
      { status: 500 }
    )
  }
}
