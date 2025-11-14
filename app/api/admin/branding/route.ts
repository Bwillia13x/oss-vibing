/**
 * Institution Branding API Endpoint
 * Manage custom branding for institutions
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import type { InstitutionBranding } from '@/lib/types/institutional'
import { requireInstitutionAccess } from '@/lib/auth'
import { adminSettingsRepository, auditLogRepository } from '@/lib/db/repositories'

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

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      )
    }

    // Note: Branding retrieval can be public (no auth required)
    // This allows the platform to display custom branding on login pages
    const brandingKey = `branding.${institutionId}`
    const branding = await adminSettingsRepository.get<InstitutionBranding>(brandingKey)

    if (!branding) {
      // Return default branding
      const defaultBranding: InstitutionBranding = {
        institutionId,
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        supportEmail: 'support@example.edu',
      }

      monitoring.trackMetric('api_response_time', Date.now() - startTime, {
        endpoint: '/api/admin/branding',
        method: 'GET',
      })

      return NextResponse.json({
        success: true,
        data: defaultBranding,
      })
    }

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/branding',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: branding,
    })
  } catch (error) {
    console.error('Error retrieving branding:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve branding'
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

    const branding: InstitutionBranding = await req.json()

    if (!branding.institutionId || !branding.primaryColor || !branding.secondaryColor) {
      return NextResponse.json(
        { error: 'institutionId, primaryColor, and secondaryColor are required' },
        { status: 400 }
      )
    }

    // Validate color format (basic hex validation)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!hexColorRegex.test(branding.primaryColor) || !hexColorRegex.test(branding.secondaryColor)) {
      return NextResponse.json(
        { error: 'Colors must be valid hex format (e.g., #2563eb)' },
        { status: 400 }
      )
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, branding.institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Save branding to database
    const brandingKey = `branding.${branding.institutionId}`
    await adminSettingsRepository.set(brandingKey, branding, 'branding')

    // Log audit entry
    await auditLogRepository.create({
      action: 'branding.created',
      resource: 'branding',
      resourceId: branding.institutionId,
      details: branding,
      severity: 'INFO',
    })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/branding',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: branding,
      message: 'Branding saved successfully',
    })
  } catch (error) {
    console.error('Error saving branding:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to save branding'
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

    const updates: Partial<InstitutionBranding> = await req.json()

    if (!updates.institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      )
    }

    // Validate colors if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (updates.primaryColor && !hexColorRegex.test(updates.primaryColor)) {
      return NextResponse.json(
        { error: 'primaryColor must be valid hex format' },
        { status: 400 }
      )
    }
    if (updates.secondaryColor && !hexColorRegex.test(updates.secondaryColor)) {
      return NextResponse.json(
        { error: 'secondaryColor must be valid hex format' },
        { status: 400 }
      )
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, updates.institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Update branding in database
    const brandingKey = `branding.${updates.institutionId}`
    const existingBranding = await adminSettingsRepository.get<InstitutionBranding>(brandingKey)
    
    const updatedBranding = {
      ...existingBranding,
      ...updates,
    }

    await adminSettingsRepository.set(brandingKey, updatedBranding, 'branding')

    // Log audit entry
    await auditLogRepository.create({
      action: 'branding.updated',
      resource: 'branding',
      resourceId: updates.institutionId,
      details: updates,
      severity: 'INFO',
    })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/branding',
      method: 'PUT',
    })

    return NextResponse.json({
      success: true,
      data: updatedBranding,
      message: 'Branding updated successfully',
    })
  } catch (error) {
    console.error('Error updating branding:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding',
      method: 'PUT',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to update branding'
      },
      { status: 500 }
    )
  }
}
