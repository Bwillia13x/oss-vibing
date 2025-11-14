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

export async function GET(req: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')
    const period = searchParams.get('period') as 'day' | 'week' | 'month' | 'year' || 'week'
    const reportType = searchParams.get('report') || 'summary'

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      )
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

    // Track API performance
    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/analytics',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('Error in admin analytics API:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/analytics',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve analytics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/analytics - Track user activity
 */
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

    const body = await req.json()
    const { userId, activity } = body

    if (!userId || !activity || !activity.metric) {
      return NextResponse.json(
        { error: 'userId, activity, and activity.metric are required' },
        { status: 400 }
      )
    }

    // Authentication check - users can only track their own activity
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const user = authResult

    // Users can only track their own activity unless they're admins
    if (user.id !== userId && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'You can only track your own activity' },
        { status: 403 }
      )
    }

    // Track activity in database
    await usageMetricRepository.create({
      userId,
      metric: activity.metric,
      value: activity.value ?? 1,
      metadata: activity.metadata,
    })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/analytics',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      message: 'Activity tracked successfully',
    })
  } catch (error) {
    console.error('Error tracking activity:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/analytics',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to track activity'
      },
      { status: 500 }
    )
  }
}
