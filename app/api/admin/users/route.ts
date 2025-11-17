/**
 * Bulk User Provisioning API Endpoint
 * Create multiple users for an institution
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import type { BulkUserProvisionRequest, BulkUserProvisionResult } from '@/lib/types/institutional'
import { requireInstitutionAccess } from '@/lib/auth'
import { userRepository, auditLogRepository, licenseRepository } from '@/lib/db/repositories'
import { createUserSchema } from '@/lib/db/validation/schemas'
import { Role } from '@prisma/client'
import { 
  RateLimitError, 
  ValidationError, 
  NotFoundError,
  BadRequestError,
  ConflictError,
  formatErrorResponse 
} from '@/lib/errors/api-errors'

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/admin/users - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const provisionRequest: BulkUserProvisionRequest = await req.json()

    if (!provisionRequest.institutionId || !provisionRequest.users || provisionRequest.users.length === 0) {
      console.warn(`[${requestId}] Invalid request: missing required fields`)
      throw new BadRequestError('institutionId and users array are required')
    }

    // Validate users array
    for (const user of provisionRequest.users) {
      if (!user.email || !user.name || !user.role) {
        console.warn(`[${requestId}] Invalid user data in bulk provision`)
        throw new ValidationError('Invalid user data', {
          user: ['Each user must have email, name, and role']
        })
      }
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, provisionRequest.institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Check license capacity
    const license = await licenseRepository.findByInstitutionId(provisionRequest.institutionId)
    if (!license) {
      console.warn(`[${requestId}] License not found for institution: ${provisionRequest.institutionId}`)
      throw new NotFoundError('License', provisionRequest.institutionId)
    }

    const availableSeats = license.seats - license.usedSeats
    if (availableSeats < provisionRequest.users.length) {
      console.warn(`[${requestId}] Insufficient license seats. Available: ${availableSeats}, Requested: ${provisionRequest.users.length}`)
      throw new BadRequestError(`Insufficient license seats. Available: ${availableSeats}, Requested: ${provisionRequest.users.length}`)
    }

    const result: BulkUserProvisionResult = {
      total: provisionRequest.users.length,
      successful: 0,
      failed: 0,
      errors: [],
      createdUsers: [],
    }

    // Create users in database
    for (const user of provisionRequest.users) {
      try {
        // Validate user data
        createUserSchema.parse({
          email: user.email,
          name: user.name,
          role: user.role,
        })

        // Create user
        const createdUser = await userRepository.create({
          email: user.email,
          name: user.name,
          role: user.role as 'USER' | 'ADMIN' | 'INSTRUCTOR',
        })

        // Increment license usage
        await licenseRepository.incrementUsedSeats(license.id)

        // Log audit entry
        await auditLogRepository.create({
          userId: createdUser.id,
          action: 'user.created',
          resource: 'user',
          resourceId: createdUser.id,
          details: {
            institutionId: provisionRequest.institutionId,
            email: user.email,
            role: user.role,
          },
          severity: 'INFO',
        })
        
        result.successful++
        result.createdUsers.push({
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name || '',
        })
      } catch (error) {
        result.failed++
        result.errors.push({
          email: user.email,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/admin/users - Success (${duration}ms, ${result.successful} created)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/users',
      method: 'POST',
      status: 'success',
      requestId,
      users_created: result.successful.toString(),
    })

    return NextResponse.json({
      success: result.failed === 0,
      data: result,
      message: `Created ${result.successful} users, ${result.failed} failed`,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/admin/users - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/users',
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

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/users - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    if (!institutionId) {
      console.warn(`[${requestId}] Missing required parameter: institutionId`)
      throw new BadRequestError('institutionId is required')
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Query database for users
    const filters: { role?: Role } = {}
    if (role) {
      filters.role = role.toUpperCase() as Role
    }

    const result = await userRepository.list(filters, { page, perPage })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/users - Success (${duration}ms, ${result.data.length} users)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/users',
      method: 'GET',
      status: 'success',
      requestId,
      users_returned: result.data.length.toString(),
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
    console.error(`[${requestId}] GET /api/admin/users - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/users',
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
