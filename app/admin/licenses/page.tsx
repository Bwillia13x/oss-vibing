/**
 * License Management Page
 * Manage institutional licenses and seat allocations
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Users, TrendingUp, AlertCircle, Plus, Loader2 } from 'lucide-react'
import { fetchLicenses, type License } from '@/lib/api/admin'
import { useInstitutionId } from '@/lib/auth/context'
import { toast } from 'sonner'

export default function LicensesPage() {
  const institutionId = useInstitutionId()
  const [licenses, setLicenses] = useState<License[]>([])
  const [loading, setLoading] = useState(true)

  const loadLicenses = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchLicenses(institutionId)
      setLicenses(data)
    } catch (error) {
      console.error('Failed to load licenses:', error)
      toast.error('Failed to load licenses')
    } finally {
      setLoading(false)
    }
  }, [institutionId])

  useEffect(() => {
    loadLicenses()
  }, [loadLicenses])

  // Calculate aggregate license data
  const licenseData = licenses.reduce(
    (acc, license) => ({
      total: acc.total + license.seats,
      used: acc.used + license.usedSeats,
      available: acc.available + (license.seats - license.usedSeats),
      renewalDate: license.endDate, // Use the latest end date
      status: license.status === 'ACTIVE' ? 'active' as const : 'inactive' as const,
    }),
    { total: 0, used: 0, available: 0, renewalDate: '', status: 'active' as const }
  )

  const usagePercentage = licenseData.total > 0 
    ? Math.round((licenseData.used / licenseData.total) * 100)
    : 0
    
  const daysUntilRenewal = licenseData.renewalDate
    ? Math.ceil((new Date(licenseData.renewalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

      {/* Licenses table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>License Details</CardTitle>
              <CardDescription>
                Active licenses for your institution
              </CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Request License
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {licenses.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No licenses found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total Seats</TableHead>
                  <TableHead className="text-right">Used</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Usage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((license) => {
                  const usage = license.seats > 0 
                    ? Math.round((license.usedSeats / license.seats) * 100)
                    : 0
                  
                  return (
                    <TableRow key={license.id}>
                      <TableCell className="font-medium">{license.type}</TableCell>
                      <TableCell className="text-right">{license.seats}</TableCell>
                      <TableCell className="text-right">{license.usedSeats}</TableCell>
                      <TableCell className="text-right">{license.seats - license.usedSeats}</TableCell>
                      <TableCell>
                        <Badge variant={license.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {license.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(license.endDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={usage} className="h-2 flex-1" />
                          <span className="text-sm text-muted-foreground w-12 text-right">
                            {usage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
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
