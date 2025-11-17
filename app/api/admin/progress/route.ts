/**
 * Student Progress API Endpoint
 * GET /api/admin/progress - Retrieve student progress tracking data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStudentProgress, updateStudentProgress } from '@/lib/admin-analytics'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireInstitutionAccess } from '@/lib/auth'
import { 
  RateLimitError, 
  BadRequestError,
  formatErrorResponse 
} from '@/lib/errors/api-errors'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/progress - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')
    const courseId = searchParams.get('courseId') || undefined

    if (!institutionId) {
      console.warn(`[${requestId}] Missing required parameter: institutionId`)
      throw new BadRequestError('institutionId is required')
    }

    // Authentication and authorization check
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin', 'instructor'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const progress = await getStudentProgress(institutionId, courseId)

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/progress - Success (${duration}ms, ${progress.length} records)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/progress',
      method: 'GET',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: progress,
      count: progress.length,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/admin/progress - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/progress',
      method: 'GET',
      requestId,
    })

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details })
      },
      { status: statusCode }
    )
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/admin/progress - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const body = await req.json()
    const { studentId, progress } = body

    if (!studentId || !progress) {
      console.warn(`[${requestId}] Missing required fields`)
      throw new BadRequestError('studentId and progress are required')
    }

    // Authentication check - admins and instructors can update progress
    const authResult = await requireInstitutionAccess(req, progress.institutionId, ['admin', 'institution-admin', 'instructor'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    await updateStudentProgress(studentId, progress)

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/admin/progress - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/progress',
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      message: 'Student progress updated',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/admin/progress - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/progress',
      method: 'POST',
      requestId,
    })

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details })
      },
      { status: statusCode }
    )
  }
}
