/**
 * Individual User API Endpoint
 * Update or delete a specific user
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { userRepository, auditLogRepository } from '@/lib/db/repositories'
import { updateUserSchema } from '@/lib/db/validation/schemas'
import { requireRole, requireInstitutionAccess } from '@/lib/auth'
import { NotFoundError, ValidationError, RateLimitError, formatErrorResponse } from '@/lib/errors/api-errors'

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params
  const userId = params.id
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] PUT /api/admin/users/${userId} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - admins only
    const authResult = await requireRole(req, ['admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const updateData = await req.json()

    // Validate update data
    const validationResult = updateUserSchema.safeParse(updateData)
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed`, validationResult.error.flatten().fieldErrors)
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const validated = validationResult.data

    console.log(`[${requestId}] Fetching user: ${userId}`)
    
    // Get user to verify it exists
    const existingUser = await userRepository.findById(userId)
    if (!existingUser) {
      console.warn(`[${requestId}] User not found: ${userId}`)
      throw new NotFoundError('User', userId)
    }

    console.log(`[${requestId}] Updating user`, {
      userId,
      updates: Object.keys(validated),
    })

    // Update user
    const updatedUser = await userRepository.update(userId, validated)

    // Log audit entry
    await auditLogRepository.create({
      userId: updatedUser.id,
      action: 'user.updated',
      resource: 'user',
      resourceId: updatedUser.id,
      details: {
        changes: validated,
      },
      severity: 'INFO',
    })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] PUT /api/admin/users/${userId} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/admin/users/${userId}`,
      method: 'PUT',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] PUT /api/admin/users/${userId} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/admin/users/${userId}`,
      method: 'PUT',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/admin/users/${userId}`,
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

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params
  const userId = params.id
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] DELETE /api/admin/users/${userId} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - admins only
    const authResult = await requireRole(req, ['admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    console.log(`[${requestId}] Fetching user: ${userId}`)
    
    // Get user to verify it exists
    const existingUser = await userRepository.findById(userId)
    if (!existingUser) {
      console.warn(`[${requestId}] User not found: ${userId}`)
      throw new NotFoundError('User', userId)
    }

    console.log(`[${requestId}] Soft deleting user: ${userId}`)

    // Soft delete user
    const deletedUser = await userRepository.delete(userId)

    // Log audit entry
    await auditLogRepository.create({
      userId: deletedUser.id,
      action: 'user.deleted',
      resource: 'user',
      resourceId: deletedUser.id,
      severity: 'WARNING',
    })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] DELETE /api/admin/users/${userId} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/admin/users/${userId}`,
      method: 'DELETE',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: deletedUser,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] DELETE /api/admin/users/${userId} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/admin/users/${userId}`,
      method: 'DELETE',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/admin/users/${userId}`,
      method: 'DELETE',
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
