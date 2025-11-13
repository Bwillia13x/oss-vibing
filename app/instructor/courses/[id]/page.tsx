/**
 * Course Detail Page
 * View course details, students, and assignments
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  BookOpen,
  Users,
  FileText,
  Plus,
  Search,
  Download,
  Edit,
  BarChart,
  TrendingUp,
  Clock,
} from 'lucide-react'

// Mock data
const mockCourse = {
  id: '1',
  code: 'CS101',
  name: 'Introduction to Programming',
  semester: 'Fall 2025',
  description: 'An introductory course covering fundamental programming concepts',
  students: 45,
  assignments: 3,
}

const mockStudents = [
  {
    id: '1',
    name: 'Alice Johnson',
    email: 'a.johnson@university.edu',
    assignmentsCompleted: 3,
    totalAssignments: 3,
    averageGrade: 92,
    lastActive: '2025-11-18',
  },
  {
    id: '2',
    name: 'Bob Smith',
    email: 'b.smith@university.edu',
    assignmentsCompleted: 2,
    totalAssignments: 3,
    averageGrade: 85,
    lastActive: '2025-11-19',
  },
  {
    id: '3',
    name: 'Carol White',
    email: 'c.white@university.edu',
    assignmentsCompleted: 3,
    totalAssignments: 3,
    averageGrade: 88,
    lastActive: '2025-11-17',
  },
  {
    id: '4',
    name: 'David Lee',
    email: 'd.lee@university.edu',
    assignmentsCompleted: 1,
    totalAssignments: 3,
    averageGrade: 78,
    lastActive: '2025-11-15',
  },
]

const mockAssignments = [
  {
    id: '1',
    title: 'Hello World Program',
    dueDate: '2025-11-18',
    status: 'closed',
    submissions: 45,
    total: 45,
    averageGrade: 95,
  },
  {
    id: '2',
    title: 'Recursion Exercises',
    dueDate: '2025-11-22',
    status: 'active',
    submissions: 12,
    total: 45,
    averageGrade: 82,
  },
  {
    id: '3',
    title: 'Final Project',
    dueDate: '2025-12-10',
    status: 'active',
    submissions: 0,
    total: 45,
    averageGrade: null,
  },
]

export default function CourseDetailPage() {
  const [course] = useState(mockCourse)
  const [students] = useState(mockStudents)
  const [assignments] = useState(mockAssignments)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const averageCourseGrade = students.length > 0
    ? Math.round(students.reduce((sum, student) => sum + student.averageGrade, 0) / students.length)
    : 0

  const completionRate = students.length > 0 && course.assignments > 0
    ? Math.round(
        (students.reduce((sum, student) => sum + student.assignmentsCompleted, 0) /
          (students.length * course.assignments)) *
          100
      )
    : 0

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Link href="/instructor/courses" className="text-muted-foreground hover:text-foreground">
              Courses
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{course.code}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {course.code} - {course.name}
          </h1>
          <p className="text-muted-foreground">{course.semester}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Edit className="mr-2 h-4 w-4" />
            Edit Course
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Data
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
            <div className="text-2xl font-bold">{course.students}</div>
            <p className="text-xs text-muted-foreground">Enrolled this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{course.assignments}</div>
            <p className="text-xs text-muted-foreground">Active assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageCourseGrade}%</div>
            <p className="text-xs text-muted-foreground">Class performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate}%</div>
            <p className="text-xs text-muted-foreground">Assignments completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="students" className="space-y-4">
        <TabsList>
          <TabsTrigger value="students">
            <Users className="mr-2 h-4 w-4" />
            Students ({course.students})
          </TabsTrigger>
          <TabsTrigger value="assignments">
            <FileText className="mr-2 h-4 w-4" />
            Assignments ({course.assignments})
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart className="mr-2 h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="details">
            <BookOpen className="mr-2 h-4 w-4" />
            Course Details
          </TabsTrigger>
        </TabsList>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Student Roster</CardTitle>
                  <CardDescription>Manage enrolled students and track progress</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Students Table */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Average Grade</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{student.name}</div>
                              <div className="text-sm text-muted-foreground">{student.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm">
                                {student.assignmentsCompleted}/{student.totalAssignments}
                              </span>
                              <Badge
                                variant={
                                  student.assignmentsCompleted === student.totalAssignments
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {student.totalAssignments > 0
                                  ? Math.round((student.assignmentsCompleted / student.totalAssignments) * 100)
                                  : 0}
                                %
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                student.averageGrade >= 90
                                  ? 'default'
                                  : student.averageGrade >= 70
                                    ? 'secondary'
                                    : 'destructive'
                              }
                            >
                              {student.averageGrade}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {new Date(student.lastActive).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Course Assignments</CardTitle>
                  <CardDescription>Manage and monitor assignments for this course</CardDescription>
                </div>
                <Button asChild>
                  <Link href="/instructor/assignments/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assignment
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <Link
                    key={assignment.id}
                    href={`/instructor/assignments/${assignment.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{assignment.title}</div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Due {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <Badge variant={assignment.status === 'active' ? 'default' : 'secondary'}>
                            {assignment.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <div className="font-medium">
                          {assignment.submissions}/{assignment.total}
                        </div>
                        <div className="text-muted-foreground">Submitted</div>
                      </div>
                      {assignment.averageGrade && (
                        <div className="text-center">
                          <div className="font-medium">{assignment.averageGrade}%</div>
                          <div className="text-muted-foreground">Average</div>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Analytics</CardTitle>
              <CardDescription>Performance insights and trends</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Grade Distribution</h3>
                <p className="text-sm text-muted-foreground">
                  Grade distribution histogram would be displayed here
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Submission Timeline</h3>
                <p className="text-sm text-muted-foreground">
                  Assignment submission trends over time
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Student Engagement</h3>
                <p className="text-sm text-muted-foreground">
                  Active participation and platform usage metrics
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Course Code</h3>
                <p className="text-muted-foreground">{course.code}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Course Name</h3>
                <p className="text-muted-foreground">{course.name}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Semester</h3>
                <p className="text-muted-foreground">{course.semester}</p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Description</h3>
                <p className="text-muted-foreground">{course.description}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
