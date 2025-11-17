/**
 * License Management API Endpoint
 * Manage institutional licenses and seat allocation
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole, requireInstitutionAccess } from '@/lib/auth'
import { licenseRepository, auditLogRepository } from '@/lib/db/repositories'
import { createLicenseSchema, updateLicenseSchema } from '@/lib/db/validation/schemas'
import { NotFoundError, ValidationError, BadRequestError, RateLimitError, formatErrorResponse } from '@/lib/errors/api-errors'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/licenses - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication check - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')
    const licenseId = searchParams.get('licenseId')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    if (licenseId) {
      console.log(`[${requestId}] Fetching specific license: ${licenseId}`)
      
      // Get specific license
      const license = await licenseRepository.findById(licenseId)
      
      if (!license) {
        console.warn(`[${requestId}] License not found: ${licenseId}`)
        throw new NotFoundError('License', licenseId)
      }

      const duration = Date.now() - startTime
      console.log(`[${requestId}] GET /api/admin/licenses - Success (${duration}ms)`)

      monitoring.trackMetric('api_response_time', duration, {
        endpoint: '/api/admin/licenses',
        method: 'GET',
        status: 'success',
        requestId,
      })

      return NextResponse.json({
        success: true,
        data: license,
      })
    }

    if (institutionId) {
      console.log(`[${requestId}] Fetching license for institution: ${institutionId}`)
      
      // Get license for institution
      const license = await licenseRepository.findByInstitutionId(institutionId)
      
      const duration = Date.now() - startTime
      console.log(`[${requestId}] GET /api/admin/licenses - Success (${duration}ms)`)

      monitoring.trackMetric('api_response_time', duration, {
        endpoint: '/api/admin/licenses',
        method: 'GET',
        status: 'success',
        requestId,
      })

      return NextResponse.json({
        success: true,
        data: license,
      })
    }

    console.log(`[${requestId}] Listing all licenses (page: ${page}, perPage: ${perPage})`)

    // Get all licenses
    const result = await licenseRepository.list({}, { page, perPage })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/licenses - Success (${duration}ms, returned: ${result.data.length})`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/licenses',
      method: 'GET',
      status: 'success',
      licenses_returned: result.data.length.toString(),
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
    console.error(`[${requestId}] GET /api/admin/licenses - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses',
      method: 'GET',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/licenses',
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

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/admin/licenses - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const licenseData = await req.json()

    // Validate license data
    const validationResult = createLicenseSchema.safeParse({
      institutionId: licenseData.institutionId,
      institution: licenseData.institution,
      seats: licenseData.maxSeats,
      expiresAt: new Date(licenseData.expiresAt),
    })

    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed`, validationResult.error.flatten().fieldErrors)
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const validated = validationResult.data

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, validated.institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    console.log(`[${requestId}] Creating license`, {
      institutionId: validated.institutionId,
      seats: validated.seats,
    })

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

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/admin/licenses - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/licenses',
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: license,
      message: 'License created successfully',
    }, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/admin/licenses - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses',
      method: 'POST',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/licenses',
      method: 'POST',
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

export async function PUT(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] PUT /api/admin/licenses - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const { id, ...updates } = await req.json()

    if (!id) {
      console.warn(`[${requestId}] License id is missing`)
      throw new BadRequestError('License id is required')
    }

    // Validate update data
    const validationResult = updateLicenseSchema.safeParse(updates)
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed`, validationResult.error.flatten().fieldErrors)
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const validated = validationResult.data

    // Authentication and authorization - admins only
    const authResult = await requireRole(req, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    console.log(`[${requestId}] Updating license`, {
      licenseId: id,
      updates: Object.keys(validated),
    })

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

    const duration = Date.now() - startTime
    console.log(`[${requestId}] PUT /api/admin/licenses - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/licenses',
      method: 'PUT',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: license,
      message: 'License updated successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] PUT /api/admin/licenses - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/licenses',
      method: 'PUT',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/licenses',
      method: 'PUT',
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
