/**
 * Admin Analytics API Endpoint
 * GET /api/admin/analytics - Retrieve institutional analytics
 */

import { NextRequest, NextResponse } from 'next/server'
import { getInstitutionAnalytics, generateAnalyticsReport } from '@/lib/admin-analytics'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireInstitutionAccess, requireAuth } from '@/lib/auth'
import { usageMetricRepository } from '@/lib/db/repositories'
import { 
  RateLimitError, 
  BadRequestError,
  AuthorizationError,
  formatErrorResponse 
} from '@/lib/errors/api-errors'

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/analytics - Request started`)
    
    // Rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year' || 'week'
    const reportType = searchParams.get('report') || 'summary'

    if (!institutionId) {
      console.warn(`[${requestId}] Missing required parameter: institutionId`)
      throw new BadRequestError('institutionId is required')
    }

    // Authentication and authorization check
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult // Return error response
    }

    let result

    if (reportType === 'full') {
      // Generate full analytics report
      result = await generateAnalyticsReport(
        institutionId,
        period === 'year' ? 'month' : period as 'week' | 'month' | 'term'
      )
    } else {
      // Get basic analytics
      result = await getInstitutionAnalytics(institutionId, period)
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/analytics - Success (${duration}ms)`)
    
    // Track API performance
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/analytics',
      method: 'GET',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/admin/analytics - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/analytics',
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

/**
 * POST /api/admin/analytics - Track user activity
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/admin/analytics - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const body = await req.json()
    const { userId, activity } = body

    if (!userId || !activity || !activity.metric) {
      console.warn(`[${requestId}] Missing required fields`)
      throw new BadRequestError('userId, activity, and activity.metric are required')
    }

    // Authentication check - users can only track their own activity
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const user = authResult

    // Users can only track their own activity unless they're admins
    if (user.id !== userId && user.role !== 'admin') {
      console.warn(`[${requestId}] Unauthorized attempt to track activity for user: ${userId}`)
      throw new AuthorizationError('You can only track your own activity')
    }

    // Track activity in database
    await usageMetricRepository.create({
      userId,
      metric: activity.metric,
      value: activity.value ?? 1,
      metadata: activity.metadata,
    })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/admin/analytics - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/analytics',
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      message: 'Activity tracked successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/admin/analytics - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/analytics',
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
