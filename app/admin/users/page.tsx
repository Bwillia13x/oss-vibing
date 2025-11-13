/**
 * Users Management Page
 * View and manage institutional users
 */

'use client'

import { Suspense, useState } from 'react'
import { UsersTable } from '@/components/admin/users-table'
import { BulkImportDialog } from '@/components/admin/bulk-import-dialog'
import { UserFormDialog } from '@/components/admin/user-form-dialog'
import { Button } from '@/components/ui/button'
import { UserPlus, Upload, Download } from 'lucide-react'

export default function UsersPage() {
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  const handleBulkImport = async (users: Array<{ name: string; email: string; role: string; department: string }>) => {
    // TODO: Call API to bulk import users
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        institutionId: 'inst_demo',
        users: users.map(u => ({
          name: u.name,
          email: u.email,
          role: u.role,
          department: u.department,
        })),
      }),
    })
    const result = await response.json()
    return result.data
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    alert('Export functionality coming soon!')
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage students, instructors, and administrators
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Bulk Import
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Users table */}
      <Suspense fallback={<TableSkeleton />}>
        <UsersTable />
      </Suspense>

      {/* Dialogs */}
      <BulkImportDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={handleBulkImport}
      />

      <UserFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSave={async (userData) => {
          // TODO: Call API to create user
          console.log('Creating user:', userData)
        }}
      />
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  )
}
