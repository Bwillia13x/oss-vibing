/**
 * Instructor Dashboard
 * Main dashboard for instructors
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import {
  BookOpen,
  FileText,
  Users,
  CheckCircle,
  Clock,
  Plus,
} from 'lucide-react'

// Mock data
const mockStats = {
  totalCourses: 3,
  totalStudents: 156,
  activeAssignments: 8,
  pendingGrading: 24,
}

const mockCourses = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Programming',
    students: 45,
    assignments: 3,
    pending: 12,
  },
  {
    id: '2',
    code: 'CS201',
    name: 'Data Structures',
    students: 38,
    assignments: 2,
    pending: 8,
  },
  {
    id: '3',
    code: 'CS301',
    name: 'Algorithms',
    students: 73,
    assignments: 3,
    pending: 4,
  },
]

const mockRecentAssignments = [
  {
    id: '1',
    title: 'Binary Search Implementation',
    course: 'CS201',
    dueDate: '2025-11-20',
    submissions: 32,
    total: 38,
  },
  {
    id: '2',
    title: 'Hello World Program',
    course: 'CS101',
    dueDate: '2025-11-18',
    submissions: 45,
    total: 45,
  },
  {
    id: '3',
    title: 'Graph Algorithm Analysis',
    course: 'CS301',
    dueDate: '2025-11-25',
    submissions: 54,
    total: 73,
  },
]

export default function InstructorDashboard() {
  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your courses and assignments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/instructor/assignments/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Active this semester
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.activeAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Currently open
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.pendingGrading}</div>
            <p className="text-xs text-muted-foreground">
              Requires attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Your Courses</CardTitle>
              <CardDescription>Active courses this semester</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/instructor/courses">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockCourses.map((course) => (
              <Link
                key={course.id}
                href={`/instructor/courses/${course.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{course.name}</div>
                    <div className="text-sm text-muted-foreground">{course.code}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-medium">{course.students}</div>
                    <div className="text-muted-foreground">Students</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">{course.assignments}</div>
                    <div className="text-muted-foreground">Assignments</div>
                  </div>
                  <div className="text-center">
                    <Badge variant={course.pending > 0 ? 'destructive' : 'secondary'}>
                      {course.pending} pending
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Assignments</CardTitle>
              <CardDescription>Latest assignments across all courses</CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/instructor/assignments">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRecentAssignments.map((assignment) => (
              <Link
                key={assignment.id}
                href={`/instructor/assignments/${assignment.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-medium">{assignment.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {assignment.course} • Due {new Date(assignment.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    {assignment.submissions === assignment.total ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">
                      {assignment.submissions}/{assignment.total} submitted
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
