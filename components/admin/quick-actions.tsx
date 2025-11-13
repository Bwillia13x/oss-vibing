/**
 * Quick Actions Component
 * Common administrative actions
 */

'use client'

import { Button } from '@/components/ui/button'
import { UserPlus, FileText, Upload, Settings } from 'lucide-react'

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-4">
      <Button className="flex items-center space-x-2">
        <UserPlus className="h-4 w-4" />
        <span>Add Users</span>
      </Button>

      <Button variant="outline" className="flex items-center space-x-2">
        <Upload className="h-4 w-4" />
        <span>Bulk Import</span>
      </Button>

      <Button variant="outline" className="flex items-center space-x-2">
        <FileText className="h-4 w-4" />
        <span>Create Assignment</span>
      </Button>

      <Button variant="outline" className="flex items-center space-x-2">
        <Settings className="h-4 w-4" />
        <span>Configure</span>
      </Button>
    </div>
  )
}
