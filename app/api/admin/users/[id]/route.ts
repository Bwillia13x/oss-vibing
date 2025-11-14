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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const userId = params.id
    const updateData = await req.json()

    // Validate update data
    const validated = updateUserSchema.parse(updateData)

    // Get user to verify it exists
    const existingUser = await userRepository.findById(userId)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Authentication and authorization - admins only
    // Use the user's institution for authorization if available
    if (existingUser.institutionId) {
      const authResult = await requireInstitutionAccess(req, existingUser.institutionId, ['admin', 'institution-admin'])
      if (authResult instanceof NextResponse) {
        return authResult
      }
    } else {
      // For users without an institution, require admin role
      const authResult = await requireRole(req, ['admin'])
      if (authResult instanceof NextResponse) {
        return authResult
      }
    }

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

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/users/[id]',
      method: 'PUT',
    })

    return NextResponse.json({
      success: true,
      data: updatedUser,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/users/[id]',
      method: 'PUT',
    })

    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update user'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
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

    const userId = params.id

    // Get user to verify it exists
    const existingUser = await userRepository.findById(userId)
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Authentication and authorization - admins only
    // Use the user's institution for authorization if available
    if (existingUser.institutionId) {
      const authResult = await requireInstitutionAccess(req, existingUser.institutionId, ['admin', 'institution-admin'])
      if (authResult instanceof NextResponse) {
        return authResult
      }
    } else {
      // For users without an institution, require admin role
      const authResult = await requireRole(req, ['admin'])
      if (authResult instanceof NextResponse) {
        return authResult
      }
    }

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

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/users/[id]',
      method: 'DELETE',
    })

    return NextResponse.json({
      success: true,
      data: deletedUser,
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/users/[id]',
      method: 'DELETE',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete user'
      },
      { status: 500 }
    )
  }
}
