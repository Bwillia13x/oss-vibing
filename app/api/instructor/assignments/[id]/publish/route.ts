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

    const published = await assignmentRepo.publish(params.id)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: `/api/instructor/assignments/${params.id}/publish`,
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: published,
      message: 'Assignment published successfully',
    })
  } catch (error) {
    console.error('Error publishing assignment:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/assignments/${params.id}/publish`,
      method: 'POST',
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
