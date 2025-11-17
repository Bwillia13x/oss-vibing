/**
 * Audit Logs API Endpoint
 * List and export audit logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'
import { auditLogRepository } from '@/lib/db/repositories'
import { AuditLog, AuditSeverity } from '@prisma/client'
import { RateLimitError, formatErrorResponse } from '@/lib/errors/api-errors'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/audit-logs - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication check - admins only
    const authResult = await requireRole(req, ['admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const resource = searchParams.get('resource')
    const severity = searchParams.get('severity') as AuditSeverity | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')
    const format = searchParams.get('format') // 'json' or 'csv'

    // Build filters
    const filters: {
      userId?: string
      action?: string
      resource?: string
      severity?: AuditSeverity
      startDate?: Date
      endDate?: Date
    } = {}
    if (userId) filters.userId = userId
    if (action) filters.action = action
    if (resource) filters.resource = resource
    if (severity) filters.severity = severity
    if (startDate) filters.startDate = new Date(startDate)
    if (endDate) filters.endDate = new Date(endDate)

    console.log(`[${requestId}] Fetching audit logs`, {
      filters: Object.keys(filters),
      page,
      perPage,
      format,
    })

    // Get audit logs
    const result = await auditLogRepository.list(filters, { page, perPage })

    // Export to CSV if requested
    if (format === 'csv') {
      console.log(`[${requestId}] Exporting audit logs to CSV`)
      
      const csv = convertToCSV(result.data)
      
      const duration = Date.now() - startTime
      console.log(`[${requestId}] GET /api/admin/audit-logs - CSV Export Success (${duration}ms)`)
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${Date.now()}.csv"`,
        },
      })
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/audit-logs - Success (${duration}ms, returned: ${result.data.length})`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/audit-logs',
      method: 'GET',
      status: 'success',
      logs_returned: result.data.length.toString(),
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        perPage: result.perPage,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/admin/audit-logs - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/audit-logs',
      method: 'GET',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/audit-logs',
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

function convertToCSV(logs: (AuditLog & { user?: { email?: string } | null })[]): string {
  if (logs.length === 0) {
    return 'timestamp,userId,userEmail,action,resource,resourceId,severity,details\n'
  }

  const header = 'timestamp,userId,userEmail,action,resource,resourceId,severity,details\n'
  const rows = logs.map(log => {
    const userEmail = log.user?.email || ''
    const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : ''
    
    return [
      log.timestamp.toISOString(),
      log.userId || '',
      userEmail,
      log.action,
      log.resource || '',
      log.resourceId || '',
      log.severity,
      `"${details}"`,
    ].join(',')
  })

  return header + rows.join('\n')
}
