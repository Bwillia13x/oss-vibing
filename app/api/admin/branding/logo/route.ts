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

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos')
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']

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

    const formData = await req.formData()
    const institutionId = formData.get('institutionId') as string
    const file = formData.get('logo') as File | null

    if (!institutionId) {
      return NextResponse.json(
        { error: 'institutionId is required' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'logo file is required' },
        { status: 400 }
      )
    }

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { 
          error: 'Invalid file type. Allowed types: PNG, JPEG, JPG, SVG, WebP',
          allowedTypes: ALLOWED_TYPES 
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
          maxSize: MAX_FILE_SIZE 
        },
        { status: 400 }
      )
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

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/branding/logo',
      method: 'POST',
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
    console.error('Error uploading logo:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding/logo',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to upload logo'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
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

    // Authentication and authorization - admins only
    const authResult = await requireInstitutionAccess(req, institutionId, ['admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    // Get current branding to find logo
    const brandingKey = `branding.${institutionId}`
    const branding = await adminSettingsRepository.get(brandingKey)

    if (!branding || !branding.logo) {
      return NextResponse.json(
        { error: 'No logo found for this institution' },
        { status: 404 }
      )
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

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/admin/branding/logo',
      method: 'DELETE',
    })

    return NextResponse.json({
      success: true,
      message: 'Logo deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting logo:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/admin/branding/logo',
      method: 'DELETE',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to delete logo'
      },
      { status: 500 }
    )
  }
}
