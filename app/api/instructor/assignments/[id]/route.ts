/**
 * Assignment by ID API Endpoint
 * Get, update, and manage individual assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { AssignmentRepository } from '@/lib/db/repositories'
import { updateAssignmentSchema } from '@/lib/db/validation/schemas'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(req.url)
    const includeSubmissions = searchParams.get('includeSubmissions') === 'true'

    const assignmentRepo = new AssignmentRepository()
    
    let assignment
    if (includeSubmissions) {
      assignment = await assignmentRepo.findByIdWithSubmissions(params.id)
    } else {
      assignment = await assignmentRepo.findById(params.id)
    }
    
    if (!assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: assignment,
    })
  } catch (error) {
    console.error('Error retrieving assignment:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve assignment'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = updateAssignmentSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid input', 
          details: validationResult.error.flatten().fieldErrors 
        },
        { status: 400 }
      )
    }

    const assignmentRepo = new AssignmentRepository()
    
    // Check if assignment exists
    const existing = await assignmentRepo.findById(params.id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    const data = validationResult.data
    const updated = await assignmentRepo.update(params.id, {
      title: data.title,
      description: data.description,
      courseId: data.courseId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      maxPoints: data.maxPoints,
      rubric: data.rubric,
      requirements: data.requirements,
      published: data.published,
    })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'PATCH',
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Assignment updated successfully',
    })
  } catch (error) {
    console.error('Error updating assignment:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'PATCH',
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const assignmentRepo = new AssignmentRepository()
    
    // Check if assignment exists
    const existing = await assignmentRepo.findById(params.id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    await assignmentRepo.delete(params.id)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'DELETE',
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting assignment:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'DELETE',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete assignment'
      },
      { status: 500 }
    )
  }
}
