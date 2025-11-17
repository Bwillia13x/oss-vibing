/**
 * Publish Assignment API Endpoint
 * Publish an assignment to make it visible to students
 */

import { NextRequest, NextResponse } from 'next/server'
import { AssignmentRepository } from '@/lib/db/repositories'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'
import { NotFoundError, RateLimitError, formatErrorResponse } from '@/lib/errors/api-errors'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/instructor/assignments/${params.id}/publish - Request started`)
    
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

    console.log(`[${requestId}] Publishing assignment: ${params.id}`)

    const published = await assignmentRepo.publish(params.id)

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/instructor/assignments/${params.id}/publish - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}/publish`,
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: published,
      message: 'Assignment published successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/instructor/assignments/${params.id}/publish - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}/publish`,
      method: 'POST',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/assignments/${params.id}/publish`,
      method: 'POST',
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
