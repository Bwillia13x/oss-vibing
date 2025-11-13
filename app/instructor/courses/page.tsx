/**
 * Courses List Page
 * View and manage all courses
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { BookOpen, Plus, Search, Users, FileText } from 'lucide-react'

const mockCourses = [
  {
    id: '1',
    code: 'CS101',
    name: 'Introduction to Programming',
    semester: 'Fall 2025',
    students: 45,
    assignments: 3,
    pending: 12,
  },
  {
    id: '2',
    code: 'CS201',
    name: 'Data Structures',
    semester: 'Fall 2025',
    students: 38,
    assignments: 2,
    pending: 8,
  },
  {
    id: '3',
    code: 'CS301',
    name: 'Algorithms',
    semester: 'Fall 2025',
    students: 73,
    assignments: 3,
    pending: 4,
  },
]

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [courses] = useState(mockCourses)

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Manage your courses and enrollments
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => (
          <Link key={course.id} href={`/instructor/courses/${course.id}`}>
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  {course.pending > 0 && (
                    <Badge variant="destructive">{course.pending} pending</Badge>
                  )}
                </div>
                <CardTitle className="mt-4">{course.code}</CardTitle>
                <CardDescription>{course.name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      Students
                    </div>
                    <span className="font-medium">{course.students}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <FileText className="mr-2 h-4 w-4" />
                      Assignments
                    </div>
                    <span className="font-medium">{course.assignments}</span>
                  </div>
                  <div className="pt-2">
                    <Badge variant="secondary">{course.semester}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No courses found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search or create a new course
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
