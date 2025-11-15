/**
 * Admin Audit Logs Page
 * Displays audit trail of administrative actions
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Download, Search, Filter, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { fetchAuditLogs, exportAuditLogs, type AuditLog } from '@/lib/api/admin'
import { useInstitutionId } from '@/lib/auth/context'
import { toast } from 'sonner'

export default function AuditLogsPage() {
  const institutionId = useInstitutionId()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const perPage = 20

  useEffect(() => {
    loadLogs()
  }, [institutionId, actionFilter, severityFilter, startDate, endDate, currentPage])

  async function loadLogs() {
    try {
      setLoading(true)
      const result = await fetchAuditLogs({
        institutionId,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        severity: severityFilter !== 'all' ? severityFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: currentPage,
        perPage,
      })
      
      setLogs(result.data)
      setTotalPages(result.pagination?.totalPages || 1)
    } catch (error) {
      console.error('Failed to load audit logs:', error)
      toast.error('Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      setExporting(true)
      await exportAuditLogs({
        institutionId,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      toast.success('Audit logs exported successfully')
    } catch (error) {
      console.error('Failed to export:', error)
      toast.error('Failed to export audit logs')
    } finally {
      setExporting(false)
    }
  }

  function getSeverityVariant(severity: string): 'default' | 'secondary' | 'destructive' {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
      case 'ERROR':
        return 'destructive'
      case 'WARNING':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true
    const search = searchQuery.toLowerCase()
    return (
      log.action.toLowerCase().includes(search) ||
      log.resource.toLowerCase().includes(search) ||
      log.details?.toLowerCase().includes(search) ||
      log.userId.toLowerCase().includes(search)
    )
  })

  // Calculate statistics
  const totalEvents = logs.length
  const criticalEvents = logs.filter(log => log.severity === 'CRITICAL' || log.severity === 'ERROR').length
  const warningEvents = logs.filter(log => log.severity === 'WARNING').length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Logs</h1>
          <p className="text-muted-foreground">
            Track all administrative actions and changes
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export to CSV
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Events</CardDescription>
            <CardTitle className="text-2xl">{totalEvents}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Critical Events</CardDescription>
            <CardTitle className="text-2xl text-red-600">
              {criticalEvents}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Warning Events</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">
              {warningEvents}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Info Events</CardDescription>
            <CardTitle className="text-2xl">
              {totalEvents - criticalEvents - warningEvents}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="USER_CREATED">User Created</SelectItem>
                <SelectItem value="USER_UPDATED">User Updated</SelectItem>
                <SelectItem value="USER_DELETED">User Deleted</SelectItem>
                <SelectItem value="LICENSE_UPDATED">License Updated</SelectItem>
                <SelectItem value="SETTINGS_CHANGED">Settings Changed</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="INFO">Info</SelectItem>
                <SelectItem value="WARNING">Warning</SelectItem>
                <SelectItem value="ERROR">Error</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {filteredLogs.length} events {searchQuery && `matching "${searchQuery}"`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No audit logs found
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{log.userId}</TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell className="text-sm">
                        {log.resource}
                        {log.resourceId && (
                          <span className="text-muted-foreground"> ({log.resourceId})</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm max-w-md truncate">
                        {log.details || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getSeverityVariant(log.severity)}>
                          {log.severity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
