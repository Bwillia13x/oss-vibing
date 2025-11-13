/**
 * Plagiarism Reports API Endpoint
 * GET /api/admin/plagiarism - Retrieve plagiarism reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPlagiarismReports, savePlagiarismReport } from '@/lib/admin-analytics'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireInstitutionAccess } from '@/lib/auth'

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
    const status = searchParams.get('status') as 'clean' | 'warning' | 'flagged' | undefined
    const courseId = searchParams.get('courseId') || undefined

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      )
    }

    // Authentication and authorization check
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin', 'instructor'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const reports = await getPlagiarismReports(institutionId, status, courseId)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/plagiarism',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: reports,
      count: reports.length,
      summary: {
        total: reports.length,
        clean: reports.filter(r => r.status === 'clean').length,
        warning: reports.filter(r => r.status === 'warning').length,
        flagged: reports.filter(r => r.status === 'flagged').length,
      }
    })
  } catch (error) {
    console.error('Error retrieving plagiarism reports:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/plagiarism',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve plagiarism reports'
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

    const report = await req.json()

    if (!report.documentId || !report.studentId) {
      return NextResponse.json(
        { error: 'documentId and studentId are required' },
        { status: 400 }
      )
    }

    // Authentication check - instructors and admins can save plagiarism reports
    const authResult = await requireInstitutionAccess(req, report.institutionId, ['admin', 'institution-admin', 'instructor'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    await savePlagiarismReport(report)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/plagiarism',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      message: 'Plagiarism report saved',
    })
  } catch (error) {
    console.error('Error saving plagiarism report:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/plagiarism',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save plagiarism report'
      },
      { status: 500 }
    )
  }
}
