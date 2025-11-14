/**
 * License Management API Endpoint
 * Manage institutional licenses and seat allocation
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import type { License } from '@/lib/types/institutional'
import { requireRole, requireInstitutionAccess } from '@/lib/auth'
import { licenseRepository, auditLogRepository } from '@/lib/db/repositories'
import { createLicenseSchema, updateLicenseSchema } from '@/lib/db/validation/schemas'

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
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    // Authentication check - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (licenseId) {
      // Get specific license
      const license = await licenseRepository.findById(licenseId)
      
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
      // Get license for institution
      const license = await licenseRepository.findByInstitutionId(institutionId)
      
      return NextResponse.json({
        success: true,
        data: license,
      })
    }

    // Get all licenses
    const result = await licenseRepository.list({}, { page, perPage })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/licenses',
      method: 'GET',
      licenses_returned: result.data.length.toString(),
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

    // Validate license data
    const validated = createLicenseSchema.parse({
      institutionId: licenseData.institutionId,
      institution: licenseData.institution,
      seats: licenseData.maxSeats,
      expiresAt: new Date(licenseData.expiresAt),
    })

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, validated.institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Create license in database
    const license = await licenseRepository.create(validated)

    // Log audit entry
    await auditLogRepository.create({
      action: 'license.created',
      resource: 'license',
      resourceId: license.id,
      details: {
        institutionId: license.institutionId,
        seats: license.seats,
      },
      severity: 'INFO',
    })

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

    // Validate update data
    const validated = updateLicenseSchema.parse(updates)

    // Authentication and authorization - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Update license in database
    const license = await licenseRepository.update(id, validated)

    // Log audit entry
    await auditLogRepository.create({
      action: 'license.updated',
      resource: 'license',
      resourceId: license.id,
      details: {
        changes: validated,
      },
      severity: 'INFO',
    })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/licenses',
      method: 'PUT',
    })

    return NextResponse.json({
      success: true,
      data: license,
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
