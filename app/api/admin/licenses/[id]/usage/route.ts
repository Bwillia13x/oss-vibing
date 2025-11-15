/**
 * License Usage API Endpoint
 * Get usage statistics for a specific license
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'
import { licenseRepository } from '@/lib/db/repositories'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
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

    const params = await context.params
    const licenseId = params.id

    // Authentication check - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get license usage stats
    const stats = await licenseRepository.getUsageStats(licenseId)
    
    if (!stats) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      )
    }

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/licenses/[id]/usage',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error('Error retrieving license usage:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses/[id]/usage',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve license usage'
      },
      { status: 500 }
    )
  }
}
