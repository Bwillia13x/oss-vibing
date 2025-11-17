/**
 * Plagiarism Reports API Endpoint
 * GET /api/admin/plagiarism - Retrieve plagiarism reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPlagiarismReports, savePlagiarismReport } from '@/lib/admin-analytics'
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
    console.log(`[${requestId}] GET /api/admin/plagiarism - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')
    const status = searchParams.get('status') as 'clean' | 'warning' | 'flagged' | undefined
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

    const reports = await getPlagiarismReports(institutionId, status, courseId)

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/plagiarism - Success (${duration}ms, ${reports.length} reports)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/plagiarism',
      method: 'GET',
      status: 'success',
      requestId,
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
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/admin/plagiarism - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/plagiarism',
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
    console.log(`[${requestId}] POST /api/admin/plagiarism - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const report = await req.json()

    if (!report.documentId || !report.studentId) {
      console.warn(`[${requestId}] Missing required fields`)
      throw new BadRequestError('documentId and studentId are required')
    }

    // Authentication check - instructors and admins can save plagiarism reports
    const authResult = await requireInstitutionAccess(req, report.institutionId, ['admin', 'institution-admin', 'instructor'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    await savePlagiarismReport(report)

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/admin/plagiarism - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/plagiarism',
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      message: 'Plagiarism report saved',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/admin/plagiarism - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/plagiarism',
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
