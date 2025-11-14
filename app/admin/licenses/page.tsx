/**
 * License Management Page
 * Manage institutional licenses and seat allocations
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Users, TrendingUp, AlertCircle, Plus } from 'lucide-react'

// Mock data
const mockLicenseData = {
  total: 1000,
  used: 734,
  available: 266,
  renewalDate: '2026-03-15',
  status: 'active' as const,
}

const mockDepartmentAllocations = [
  { id: '1', department: 'Computer Science', allocated: 200, used: 178, percentage: 89 },
  { id: '2', department: 'Mathematics', allocated: 150, used: 142, percentage: 95 },
  { id: '3', department: 'Biology', allocated: 180, used: 156, percentage: 87 },
  { id: '4', department: 'Chemistry', allocated: 120, used: 98, percentage: 82 },
  { id: '5', department: 'Physics', allocated: 100, used: 82, percentage: 82 },
  { id: '6', department: 'Engineering', allocated: 250, used: 78, percentage: 31 },
]

export default function LicensesPage() {
  const [licenseData] = useState(mockLicenseData)
  const [allocations] = useState(mockDepartmentAllocations)
  const [currentTime] = useState(() => Date.now())

  const usagePercentage = Math.round((licenseData.used / licenseData.total) * 100)
  const daysUntilRenewal = Math.ceil((new Date(licenseData.renewalDate).getTime() - currentTime) / (1000 * 60 * 60 * 24))

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">License Management</h1>
          <p className="text-muted-foreground">
            Manage seat allocations and license usage
          </p>
        </div>

        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Department Quota
        </Button>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Licenses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenseData.total}</div>
            <p className="text-xs text-muted-foreground">
              Institutional capacity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenseData.used}</div>
            <p className="text-xs text-muted-foreground">
              {usagePercentage}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenseData.available}</div>
            <p className="text-xs text-muted-foreground">
              Remaining seats
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Renewal</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysUntilRenewal}d</div>
            <p className="text-xs text-muted-foreground">
              Until renewal date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Usage progress */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Usage</CardTitle>
          <CardDescription>
            {licenseData.used} of {licenseData.total} licenses used ({usagePercentage}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={usagePercentage} className="h-4" />
          <div className="mt-4 text-sm text-muted-foreground">
            <strong>Status:</strong>{' '}
            <Badge variant={usagePercentage > 90 ? 'destructive' : usagePercentage > 75 ? 'default' : 'secondary'}>
              {usagePercentage > 90 ? 'Critical' : usagePercentage > 75 ? 'High Usage' : 'Normal'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Department allocations */}
      <Card>
        <CardHeader>
          <CardTitle>Department Allocations</CardTitle>
          <CardDescription>
            Seat allocations by department
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Allocated</TableHead>
                <TableHead className="text-right">Used</TableHead>
                <TableHead className="text-right">Available</TableHead>
                <TableHead>Usage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.department}</TableCell>
                  <TableCell className="text-right">{dept.allocated}</TableCell>
                  <TableCell className="text-right">{dept.used}</TableCell>
                  <TableCell className="text-right">{dept.allocated - dept.used}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={dept.percentage} className="h-2 flex-1" />
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {dept.percentage}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Renewal information */}
      <Card>
        <CardHeader>
          <CardTitle>License Information</CardTitle>
          <CardDescription>
            Current license details and renewal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-sm font-medium">License Type:</span>
            <Badge>Institutional Enterprise</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Renewal Date:</span>
            <span className="text-sm">{new Date(licenseData.renewalDate).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm font-medium">Auto-Renewal:</span>
            <Badge variant="secondary">Enabled</Badge>
          </div>
          <div className="pt-4">
            <Button variant="outline" className="w-full">
              Manage License Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
