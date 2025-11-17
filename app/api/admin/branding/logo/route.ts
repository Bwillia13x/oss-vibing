/**
 * Logo Upload API Endpoint
 * Upload institution logo for branding
 */

import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireInstitutionAccess } from '@/lib/auth'
import { adminSettingsRepository, auditLogRepository } from '@/lib/db/repositories'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { 
  RateLimitError, 
  BadRequestError, 
  ValidationError,
  NotFoundError,
  formatErrorResponse 
} from '@/lib/errors/api-errors'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/admin/branding/logo - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const formData = await req.formData()
    const institutionId = formData.get('institutionId') as string
    const file = formData.get('logo') as File | null

    if (!institutionId) {
      console.warn(`[${requestId}] Missing institutionId`)
      throw new BadRequestError('institutionId is required')
    }

    if (!file) {
      console.warn(`[${requestId}] Missing logo file`)
      throw new BadRequestError('logo file is required')
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn(`[${requestId}] Invalid file type: ${file.type}`)
      throw new ValidationError('Invalid file type', {
        fileType: [`Allowed types: PNG, JPEG, JPG, SVG, WebP`]
      })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.warn(`[${requestId}] File too large: ${file.size} bytes`)
      throw new ValidationError('File too large', {
        fileSize: [`Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`]
      })
    }

    // Create upload directory if it doesn't exist
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop() || 'png'
    const filename = `${institutionId}-${timestamp}.${extension}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Save file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Generate public URL
    const logoUrl = `/uploads/logos/${filename}`

    // Update branding with logo URL
    const brandingKey = `branding.${institutionId}`
    const existingBranding = await adminSettingsRepository.get(brandingKey) || {}
    
    const updatedBranding = {
      ...existingBranding,
      institutionId,
      logo: logoUrl,
    }

    await adminSettingsRepository.set(brandingKey, updatedBranding, 'branding')

    // Log audit entry
    await auditLogRepository.create({
      action: 'branding.logo_uploaded',
      resource: 'branding',
      resourceId: institutionId,
      details: {
        filename,
        size: file.size,
        type: file.type,
        url: logoUrl,
      },
      severity: 'INFO',
    })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/admin/branding/logo - Success (${duration}ms, ${file.size} bytes)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/branding/logo',
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: {
        url: logoUrl,
        filename,
        size: file.size,
        type: file.type,
      },
      message: 'Logo uploaded successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/admin/branding/logo - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding/logo',
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

export async function DELETE(req: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] DELETE /api/admin/branding/logo - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    const { searchParams } = new URL(req.url)
    const institutionId = searchParams.get('institutionId')

    if (!institutionId) {
      console.warn(`[${requestId}] Missing institutionId`)
      throw new BadRequestError('institutionId is required')
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get current branding to find logo
    const brandingKey = `branding.${institutionId}`
    const branding = await adminSettingsRepository.get(brandingKey) as { logo?: string } | null

    if (!branding || !branding.logo) {
      console.warn(`[${requestId}] No logo found for institution: ${institutionId}`)
      throw new NotFoundError('Logo', institutionId)
    }

    // Remove logo from branding
    const updatedBranding = {
      ...branding,
      logo: undefined,
    }

    await adminSettingsRepository.set(brandingKey, updatedBranding, 'branding')

    // Log audit entry
    await auditLogRepository.create({
      action: 'branding.logo_deleted',
      resource: 'branding',
      resourceId: institutionId,
      details: {
        deletedLogo: branding.logo,
      },
      severity: 'INFO',
    })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] DELETE /api/admin/branding/logo - Success (${duration}ms)`)
    
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/admin/branding/logo',
      method: 'DELETE',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] DELETE /api/admin/branding/logo - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding/logo',
      method: 'DELETE',
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
