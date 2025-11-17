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
import { NotFoundError, ValidationError, RateLimitError, formatErrorResponse } from '@/lib/errors/api-errors'

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
      throw new RateLimitError()
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
      throw new NotFoundError('Assignment', params.id)
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

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details }),
      },
      { status: statusCode }
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
      throw new RateLimitError()
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
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const assignmentRepo = new AssignmentRepository()
    
    // Check if assignment exists
    const existing = await assignmentRepo.findById(params.id)
    if (!existing) {
      throw new NotFoundError('Assignment', params.id)
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

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details }),
      },
      { status: statusCode }
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
      throw new RateLimitError()
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
      throw new NotFoundError('Assignment', params.id)
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

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details }),
      },
      { status: statusCode }
    )
  }
}
