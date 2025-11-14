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

    const provisionRequest: BulkUserProvisionRequest = await req.json()

    if (!provisionRequest.institutionId || !provisionRequest.users || provisionRequest.users.length === 0) {
      return NextResponse.json(
        { error: 'institutionId and users array are required' },
        { status: 400 }
      )
    }

    // Validate users array
    for (const user of provisionRequest.users) {
      if (!user.email || !user.name || !user.role) {
        return NextResponse.json(
          { error: 'Each user must have email, name, and role' },
          { status: 400 }
        )
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
      return NextResponse.json(
        { error: 'Institution license not found' },
        { status: 404 }
      )
    }

    const availableSeats = license.seats - license.usedSeats
    if (availableSeats < provisionRequest.users.length) {
      return NextResponse.json(
        { error: `Insufficient license seats. Available: ${availableSeats}, Requested: ${provisionRequest.users.length}` },
        { status: 400 }
      )
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

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/users',
      method: 'POST',
      users_created: result.successful.toString(),
    })

    return NextResponse.json({
      success: result.failed === 0,
      data: result,
      message: `Created ${result.successful} users, ${result.failed} failed`,
    })
  } catch (error) {
    console.error('Error provisioning users:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/users',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to provision users'
      },
      { status: 500 }
    )
  }
}

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
    const role = searchParams.get('role')
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('perPage') || '20')

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      )
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Query database for users
    const filters: { role?: string } = {}
    if (role) {
      filters.role = role.toUpperCase()
    }

    const result = await userRepository.list(filters, { page, perPage })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/users',
      method: 'GET',
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
    console.error('Error retrieving users:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/users',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve users'
      },
      { status: 500 }
    )
  }
}
