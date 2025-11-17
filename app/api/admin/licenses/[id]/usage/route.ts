/**
 * License Usage API Endpoint
 * Get usage statistics for a specific license
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'
import { licenseRepository } from '@/lib/db/repositories'
import { 
  RateLimitError, 
  NotFoundError,
  formatErrorResponse 
} from '@/lib/errors/api-errors'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params
  const licenseId = params.id
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/licenses/${licenseId}/usage - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication check - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get license usage stats
    const stats = await licenseRepository.getUsageStats(licenseId)
    
    if (!stats) {
      console.warn(`[${requestId}] License not found: ${licenseId}`)
      throw new NotFoundError('License', licenseId)
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/licenses/${licenseId}/usage - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/licenses/[id]/usage',
      method: 'GET',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/admin/licenses/${licenseId}/usage - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses/[id]/usage',
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
