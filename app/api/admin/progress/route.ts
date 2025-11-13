/**
 * Student Progress API Endpoint
 * GET /api/admin/progress - Retrieve student progress tracking data
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStudentProgress, updateStudentProgress } from '@/lib/admin-analytics'
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
    const institutionId = searchParams.get('institutionId')
    const courseId = searchParams.get('courseId') || undefined

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      )
    }

    // TODO: Add authentication and authorization check

    const progress = await getStudentProgress(institutionId, courseId)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/progress',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: progress,
      count: progress.length,
    })
  } catch (error) {
    console.error('Error retrieving student progress:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/progress',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve student progress'
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

    const body = await req.json()
    const { studentId, progress } = body

    if (!studentId || !progress) {
      return NextResponse.json(
        { error: 'studentId and progress are required' },
        { status: 400 }
      )
    }

    // TODO: Add authentication and authorization check

    await updateStudentProgress(studentId, progress)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/progress',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      message: 'Student progress updated',
    })
  } catch (error) {
    console.error('Error updating student progress:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/progress',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update student progress'
      },
      { status: 500 }
    )
  }
}
