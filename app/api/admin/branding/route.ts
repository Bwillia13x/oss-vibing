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
import { 
  RateLimitError, 
  BadRequestError, 
  ValidationError,
  formatErrorResponse 
} from '@/lib/errors/api-errors'

export async function GET(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/admin/branding - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')

    if (!institutionId) {
      console.warn(`[${requestId}] Missing required parameter: institutionId`)
      throw new BadRequestError('institutionId is required')
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

      const duration = Date.now() - startTime
      console.log(`[${requestId}] GET /api/admin/branding - Success (${duration}ms, default branding)`)
      
      monitoring.trackMetric('api_response_time', duration, {
        endpoint: '/api/admin/branding',
        method: 'GET',
        status: 'success',
        requestId,
      })

      return NextResponse.json({
        success: true,
        data: defaultBranding,
      })
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/admin/branding - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/branding',
      method: 'GET',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: branding,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/admin/branding - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding',
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

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/admin/branding - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const branding: InstitutionBranding = await req.json()

    if (!branding.institutionId || !branding.primaryColor || !branding.secondaryColor) {
      console.warn(`[${requestId}] Missing required fields`)
      throw new BadRequestError('institutionId, primaryColor, and secondaryColor are required')
    }

    // Validate color format (basic hex validation)
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!hexColorRegex.test(branding.primaryColor) || !hexColorRegex.test(branding.secondaryColor)) {
      console.warn(`[${requestId}] Invalid color format`)
      throw new ValidationError('Invalid color format', {
        colors: ['Colors must be valid hex format (e.g., #2563eb)']
      })
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
      details: branding as unknown as Record<string, unknown>,
      severity: 'INFO',
    })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/admin/branding - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/branding',
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: branding,
      message: 'Branding saved successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/admin/branding - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding',
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

export async function PUT(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] PUT /api/admin/branding - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const updates: Partial<InstitutionBranding> = await req.json()

    if (!updates.institutionId) {
      console.warn(`[${requestId}] Missing required parameter: institutionId`)
      throw new BadRequestError('institutionId is required')
    }

    // Validate colors if provided
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (updates.primaryColor && !hexColorRegex.test(updates.primaryColor)) {
      console.warn(`[${requestId}] Invalid primaryColor format`)
      throw new ValidationError('Invalid color format', {
        primaryColor: ['primaryColor must be valid hex format']
      })
    }
    if (updates.secondaryColor && !hexColorRegex.test(updates.secondaryColor)) {
      console.warn(`[${requestId}] Invalid secondaryColor format`)
      throw new ValidationError('Invalid color format', {
        secondaryColor: ['secondaryColor must be valid hex format']
      })
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

    const duration = Date.now() - startTime
    console.log(`[${requestId}] PUT /api/admin/branding - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/branding',
      method: 'PUT',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: updatedBranding,
      message: 'Branding updated successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] PUT /api/admin/branding - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding',
      method: 'PUT',
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
