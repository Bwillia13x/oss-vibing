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
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/instructor/assignments/${params.id} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const { searchParams } = new URL(req.url)
    const includeSubmissions = searchParams.get('includeSubmissions') === 'true'

    console.log(`[${requestId}] Fetching assignment`, {
      assignmentId: params.id,
      includeSubmissions,
    })

    const assignmentRepo = new AssignmentRepository()
    
    let assignment
    if (includeSubmissions) {
      assignment = await assignmentRepo.findByIdWithSubmissions(params.id)
    } else {
      assignment = await assignmentRepo.findById(params.id)
    }
    
    if (!assignment) {
      console.warn(`[${requestId}] Assignment not found: ${params.id}`)
      throw new NotFoundError('Assignment', params.id)
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/instructor/assignments/${params.id} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'GET',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: assignment,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/instructor/assignments/${params.id} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'GET',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'GET',
      status: 'error',
      requestId,
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
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] PATCH /api/instructor/assignments/${params.id} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = updateAssignmentSchema.safeParse(body)
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed`, validationResult.error.flatten().fieldErrors)
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const assignmentRepo = new AssignmentRepository()
    
    // Check if assignment exists
    const existing = await assignmentRepo.findById(params.id)
    if (!existing) {
      console.warn(`[${requestId}] Assignment not found: ${params.id}`)
      throw new NotFoundError('Assignment', params.id)
    }

    console.log(`[${requestId}] Updating assignment`, {
      assignmentId: params.id,
      updates: Object.keys(body),
    })

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

    const duration = Date.now() - startTime
    console.log(`[${requestId}] PATCH /api/instructor/assignments/${params.id} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'PATCH',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Assignment updated successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] PATCH /api/instructor/assignments/${params.id} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'PATCH',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'PATCH',
      status: 'error',
      requestId,
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
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] DELETE /api/instructor/assignments/${params.id} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const assignmentRepo = new AssignmentRepository()
    
    // Check if assignment exists
    const existing = await assignmentRepo.findById(params.id)
    if (!existing) {
      console.warn(`[${requestId}] Assignment not found: ${params.id}`)
      throw new NotFoundError('Assignment', params.id)
    }

    console.log(`[${requestId}] Deleting assignment: ${params.id}`)

    await assignmentRepo.delete(params.id)

    const duration = Date.now() - startTime
    console.log(`[${requestId}] DELETE /api/instructor/assignments/${params.id} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'DELETE',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] DELETE /api/instructor/assignments/${params.id} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'DELETE',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}`,
      method: 'DELETE',
      status: 'error',
      requestId,
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
