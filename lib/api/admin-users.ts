/**
 * Admin Users API Client
 * Client-side service for managing users via admin APIs
 */

export interface User {
  id: string
  name: string
  email: string
  role: 'USER' | 'ADMIN' | 'INSTRUCTOR'
  institutionId?: string
  createdAt?: string
  updatedAt?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface BulkUserImport {
  name: string
  email: string
  role: string
  department?: string
}

export interface BulkImportResult {
  total: number
  successful: number
  failed: number
  errors: Array<{ email: string; error: string }>
  createdUsers: Array<{ id: string; email: string; name: string }>
}

/**
 * Fetch paginated list of users
 */
export async function fetchUsers(
  institutionId: string,
  options?: {
    role?: string
    page?: number
    perPage?: number
  }
): Promise<PaginatedResponse<User>> {
  const params = new URLSearchParams({
    institutionId,
    ...(options?.role && { role: options.role }),
    ...(options?.page && { page: options.page.toString() }),
    ...(options?.perPage && { perPage: options.perPage.toString() }),
  })

  const response = await fetch(`/api/admin/users?${params}`)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch users' }))
    throw new Error(error.error || 'Failed to fetch users')
  }

  return response.json()
}

/**
 * Create a single user
 */
export async function createUser(
  institutionId: string,
  userData: {
    name: string
    email: string
    role: string
  }
): Promise<User> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      institutionId,
      users: [userData],
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to create user' }))
    throw new Error(error.error || 'Failed to create user')
  }

  const result = await response.json()
  
  // Extract the first created user from the bulk import result
  if (result.data?.createdUsers?.[0]) {
    return result.data.createdUsers[0]
  }
  
  throw new Error('User creation succeeded but no user data returned')
}

/**
 * Bulk import users
 */
export async function bulkImportUsers(
  institutionId: string,
  users: BulkUserImport[]
): Promise<BulkImportResult> {
  const response = await fetch('/api/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      institutionId,
      users,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to import users' }))
    throw new Error(error.error || 'Failed to import users')
  }

  const result = await response.json()
  return result.data
}

/**
 * Update a user
 */
export async function updateUser(
  userId: string,
  updates: {
    name?: string
    email?: string
    role?: string
  }
): Promise<User> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update user' }))
    throw new Error(error.error || 'Failed to update user')
  }

  const result = await response.json()
  return result.data
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string): Promise<void> {
  const response = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete user' }))
    throw new Error(error.error || 'Failed to delete user')
  }
}

/**
 * Export users to CSV
 */
export async function exportUsersToCSV(
  institutionId: string,
  roleFilter?: string
): Promise<void> {
  try {
    // Fetch all users (we'll need to handle pagination)
    const result = await fetchUsers(institutionId, {
      role: roleFilter !== 'all' ? roleFilter : undefined,
      perPage: 1000, // Get a large batch
    })

    // Convert to CSV
    const headers = ['ID', 'Name', 'Email', 'Role', 'Created At']
    const rows = result.data.map(user => [
      user.id,
      user.name,
      user.email,
      user.role,
      user.createdAt || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}
