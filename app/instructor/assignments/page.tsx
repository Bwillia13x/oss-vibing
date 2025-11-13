/**
 * Assignments List Page
 * View and manage all assignments
 */

'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Plus, Search, FileText } from 'lucide-react'

const mockAssignments = [
  {
    id: '1',
    title: 'Binary Search Implementation',
    course: 'CS201 - Data Structures',
    dueDate: '2025-11-20',
    status: 'active',
    submissions: 32,
    total: 38,
  },
  {
    id: '2',
    title: 'Hello World Program',
    course: 'CS101 - Intro to Programming',
    dueDate: '2025-11-18',
    status: 'closed',
    submissions: 45,
    total: 45,
  },
  {
    id: '3',
    title: 'Graph Algorithm Analysis',
    course: 'CS301 - Algorithms',
    dueDate: '2025-11-25',
    status: 'active',
    submissions: 54,
    total: 73,
  },
  {
    id: '4',
    title: 'Recursion Exercises',
    course: 'CS101 - Intro to Programming',
    dueDate: '2025-11-22',
    status: 'active',
    submissions: 12,
    total: 45,
  },
]

export default function AssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [assignments] = useState(mockAssignments)

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         assignment.course.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge>Active</Badge>
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getSubmissionProgress = (submissions: number, total: number) => {
    const percentage = Math.round((submissions / total) * 100)
    return (
      <div className="flex items-center space-x-2">
        <span>{submissions}/{total}</span>
        <span className="text-muted-foreground">({percentage}%)</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Manage assignments across all courses
          </p>
        </div>
        <Button asChild>
          <Link href="/instructor/assignments/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Assignment
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assignment</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submissions</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssignments.map((assignment) => (
              <TableRow key={assignment.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{assignment.title}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {assignment.course}
                </TableCell>
                <TableCell>
                  {new Date(assignment.dueDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {getStatusBadge(assignment.status)}
                </TableCell>
                <TableCell>
                  {getSubmissionProgress(assignment.submissions, assignment.total)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/instructor/assignments/${assignment.id}`}>
                      View
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAssignments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Try adjusting your filters or create a new assignment
          </p>
        </div>
      )}

      <div className="text-sm text-muted-foreground">
        Showing {filteredAssignments.length} of {assignments.length} assignments
      </div>
    </div>
  )
}
