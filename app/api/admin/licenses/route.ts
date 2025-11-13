/**
 * License Management API Endpoint
 * Manage institutional licenses and seat allocation
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import type { License } from '@/lib/types/institutional'
import { requireRole, requireInstitutionAccess } from '@/lib/auth'

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
    const licenseId = searchParams.get('licenseId')

    // Authentication check - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (licenseId) {
      // Get specific license
      // TODO: Query database
      const license: License | null = null
      
      if (!license) {
        return NextResponse.json(
          { error: 'License not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: license,
      })
    }

    if (institutionId) {
      // Get all licenses for institution
      // TODO: Query database
      const licenses: License[] = []
      
      return NextResponse.json({
        success: true,
        data: licenses,
        count: licenses.length,
      })
    }

    return NextResponse.json(
      { error: 'Either institutionId or licenseId is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error retrieving licenses:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve licenses'
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

    const licenseData = await req.json()

    if (!licenseData.institutionId || !licenseData.type || !licenseData.maxSeats) {
      return NextResponse.json(
        { error: 'institutionId, type, and maxSeats are required' },
        { status: 400 }
      )
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, licenseData.institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // TODO: Create license in database

    const license: License = {
      id: `lic_${Date.now()}`,
      ...licenseData,
      usedSeats: 0,
      createdAt: new Date(),
    }

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/licenses',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: license,
      message: 'License created successfully',
    })
  } catch (error) {
    console.error('Error creating license:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create license'
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
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

    const { id, ...updates } = await req.json()

    if (!id) {
      return NextResponse.json(
        { error: 'License id is required' },
        { status: 400 }
      )
    }

    // Authentication and authorization - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // TODO: Update license in database

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/licenses',
      method: 'PUT',
    })

    return NextResponse.json({
      success: true,
      message: 'License updated successfully',
    })
  } catch (error) {
    console.error('Error updating license:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses',
      method: 'PUT',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update license'
      },
      { status: 500 }
    )
  }
}
