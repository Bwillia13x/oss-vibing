/**
 * Admin API Client
 * Comprehensive client for all admin API endpoints
 */

export interface License {
  id: string
  institutionId: string
  type: string
  seats: number
  usedSeats: number
  startDate: string
  endDate: string
  status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED'
  features: string[]
  cost: number
}

export interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  details?: any
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
  timestamp: string
  ipAddress?: string
  userAgent?: string
}

export interface Analytics {
  activeUsers: number
  totalUsers: number
  documentsCreated: number
  apiCalls: number
  cacheHitRate: number
  averageResponseTime: number
  topFeatures: Array<{ feature: string; usage: number }>
  usageOverTime: Array<{ date: string; count: number }>
}

export interface BrandingSettings {
  primaryColor: string
  secondaryColor: string
  logoUrl?: string
  institutionName: string
  customCSS?: string
}

/**
 * Get all licenses for an institution
 */
export async function fetchLicenses(institutionId: string): Promise<License[]> {
  const response = await fetch(`/api/admin/licenses?institutionId=${institutionId}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch licenses' }))
    throw new Error(error.error || 'Failed to fetch licenses')
  }

  const result = await response.json()
  return result.data || []
}

/**
 * Get license by ID
 */
export async function fetchLicense(licenseId: string): Promise<License> {
  const response = await fetch(`/api/admin/licenses?licenseId=${licenseId}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch license' }))
    throw new Error(error.error || 'Failed to fetch license')
  }

  const result = await response.json()
  return result.data
}

/**
 * Update license
 */
export async function updateLicense(
  licenseId: string,
  updates: Partial<License>
): Promise<License> {
  const response = await fetch(`/api/admin/licenses/${licenseId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update license' }))
    throw new Error(error.error || 'Failed to update license')
  }

  const result = await response.json()
  return result.data
}

/**
 * Get audit logs
 */
export async function fetchAuditLogs(params?: {
  institutionId?: string
  userId?: string
  action?: string
  severity?: string
  startDate?: string
  endDate?: string
  page?: number
  perPage?: number
}): Promise<{ data: AuditLog[]; pagination: any }> {
  const searchParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })
  }

  const response = await fetch(`/api/admin/audit-logs?${searchParams}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch audit logs' }))
    throw new Error(error.error || 'Failed to fetch audit logs')
  }

  const result = await response.json()
  return {
    data: result.data || [],
    pagination: result.pagination || {},
  }
}

/**
 * Export audit logs to CSV
 */
export async function exportAuditLogs(params?: {
  institutionId?: string
  startDate?: string
  endDate?: string
}): Promise<void> {
  const searchParams = new URLSearchParams({ format: 'csv' })
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })
  }

  const response = await fetch(`/api/admin/audit-logs?${searchParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to export audit logs')
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get analytics data
 */
export async function fetchAnalytics(params?: {
  institutionId?: string
  period?: 'day' | 'week' | 'month' | 'year'
  startDate?: string
  endDate?: string
}): Promise<Analytics> {
  const searchParams = new URLSearchParams()
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value)
      }
    })
  }

  const response = await fetch(`/api/admin/analytics?${searchParams}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch analytics' }))
    throw new Error(error.error || 'Failed to fetch analytics')
  }

  const result = await response.json()
  return result.data
}

/**
 * Get branding settings
 */
export async function fetchBrandingSettings(institutionId: string): Promise<BrandingSettings> {
  const response = await fetch(`/api/admin/branding?institutionId=${institutionId}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch branding' }))
    throw new Error(error.error || 'Failed to fetch branding settings')
  }

  const result = await response.json()
  return result.data
}

/**
 * Update branding settings
 */
export async function updateBrandingSettings(
  institutionId: string,
  settings: Partial<BrandingSettings>
): Promise<BrandingSettings> {
  const response = await fetch('/api/admin/branding', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      institutionId,
      ...settings,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update branding' }))
    throw new Error(error.error || 'Failed to update branding settings')
  }

  const result = await response.json()
  return result.data
}

/**
 * Upload institution logo
 */
export async function uploadLogo(institutionId: string, file: File): Promise<string> {
  const formData = new FormData()
  formData.append('logo', file)
  formData.append('institutionId', institutionId)

  const response = await fetch('/api/admin/branding/logo', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upload logo' }))
    throw new Error(error.error || 'Failed to upload logo')
  }

  const result = await response.json()
  return result.data.logoUrl
}

/**
 * Delete institution logo
 */
export async function deleteLogo(institutionId: string): Promise<void> {
  const response = await fetch(`/api/admin/branding/logo?institutionId=${institutionId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete logo' }))
    throw new Error(error.error || 'Failed to delete logo')
  }
}
