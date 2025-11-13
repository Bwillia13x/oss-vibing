/**
 * Assignment Detail Page
 * View assignment details and student submissions
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import {
  FileText,
  Users,
  CheckCircle,
  Clock,
  Download,
  Edit,
  BarChart,
  AlertCircle,
} from 'lucide-react'

// Mock data for the assignment
const mockAssignment = {
  id: '1',
  title: 'Binary Search Implementation',
  course: 'CS201 - Data Structures',
  courseId: '2',
  description: 'Implement binary search algorithm with proper documentation',
  dueDate: '2025-11-20T23:59:00',
  pointsPossible: 100,
  status: 'active',
  minCitations: 3,
  citationStyle: 'APA',
  rubric: [
    { name: 'Implementation', points: 40, description: 'Correct algorithm implementation' },
    { name: 'Documentation', points: 20, description: 'Clear code comments and docs' },
    { name: 'Test Cases', points: 20, description: 'Comprehensive test coverage' },
    { name: 'Code Quality', points: 20, description: 'Clean, readable code' },
  ],
}

// Mock submissions
const mockSubmissions = [
  {
    id: '1',
    studentName: 'Alice Johnson',
    studentId: 'a.johnson@university.edu',
    submittedAt: '2025-11-18T14:30:00',
    status: 'graded',
    grade: 92,
    plagiarismScore: 5,
  },
  {
    id: '2',
    studentName: 'Bob Smith',
    studentId: 'b.smith@university.edu',
    submittedAt: '2025-11-19T10:15:00',
    status: 'pending',
    grade: null,
    plagiarismScore: 8,
  },
  {
    id: '3',
    studentName: 'Carol White',
    studentId: 'c.white@university.edu',
    submittedAt: '2025-11-19T22:45:00',
    status: 'pending',
    grade: null,
    plagiarismScore: 3,
  },
  {
    id: '4',
    studentName: 'David Lee',
    studentId: 'd.lee@university.edu',
    submittedAt: null,
    status: 'not_submitted',
    grade: null,
    plagiarismScore: null,
  },
]

export default function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [assignment] = useState(mockAssignment)
  const [submissions] = useState(mockSubmissions)

  const totalStudents = 38
  const submittedCount = submissions.filter((s) => s.submittedAt).length
  const gradedCount = submissions.filter((s) => s.status === 'graded').length
  const pendingCount = submittedCount - gradedCount
  const submissionRate = Math.round((submittedCount / totalStudents) * 100)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'graded':
        return (
          <Badge className="bg-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            Graded
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case 'not_submitted':
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Not Submitted
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link
              href="/instructor/assignments"
              className="text-muted-foreground hover:text-foreground"
            >
              Assignments
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{assignment.title}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
          <p className="text-muted-foreground">{assignment.course}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href={`/instructor/assignments/${assignment.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Enrolled in course</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
            <Progress value={submissionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">{submissionRate}% submission rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Graded</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground">
              {pendingCount} pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92</div>
            <p className="text-xs text-muted-foreground">Out of {assignment.pointsPossible}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="submissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="submissions">
            Submissions ({submittedCount})
          </TabsTrigger>
          <TabsTrigger value="details">Assignment Details</TabsTrigger>
          <TabsTrigger value="rubric">Grading Rubric</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Submissions Tab */}
        <TabsContent value="submissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Submissions</CardTitle>
                  <CardDescription>Review and grade student work</CardDescription>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Plagiarism</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{submission.studentName}</div>
                            <div className="text-sm text-muted-foreground">
                              {submission.studentId}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {submission.submittedAt ? (
                            <div className="text-sm">
                              {new Date(submission.submittedAt).toLocaleDateString()}
                              <div className="text-xs text-muted-foreground">
                                {new Date(submission.submittedAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell>
                          {submission.grade !== null ? (
                            <span className="font-medium">
                              {submission.grade}/{assignment.pointsPossible}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.plagiarismScore !== null ? (
                            <Badge
                              variant={
                                submission.plagiarismScore < 10
                                  ? 'default'
                                  : submission.plagiarismScore < 25
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {submission.plagiarismScore}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {submission.submittedAt && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/instructor/grading/${submission.id}`}>
                                {submission.status === 'graded' ? 'Review' : 'Grade'}
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignment Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{assignment.description}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Due Date</h3>
                  <p className="text-muted-foreground">
                    {new Date(assignment.dueDate).toLocaleString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Points Possible</h3>
                  <p className="text-muted-foreground">{assignment.pointsPossible}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-medium mb-2">Citation Requirements</h3>
                  <p className="text-muted-foreground">
                    Minimum {assignment.minCitations} sources in {assignment.citationStyle} format
                  </p>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Status</h3>
                  <Badge>{assignment.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rubric Tab */}
        <TabsContent value="rubric" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Grading Rubric</CardTitle>
              <CardDescription>
                Total: {assignment.pointsPossible} points
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignment.rubric.map((criterion, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{criterion.name}</h3>
                      <Badge>{criterion.points} points</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{criterion.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Analytics</CardTitle>
              <CardDescription>Performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Submission Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Submissions over time would be displayed here as a chart
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Grade Distribution</h3>
                <p className="text-sm text-muted-foreground">
                  Grade distribution histogram would be displayed here
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Common Issues</h3>
                <p className="text-sm text-muted-foreground">
                  Analysis of common student mistakes and challenges
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
