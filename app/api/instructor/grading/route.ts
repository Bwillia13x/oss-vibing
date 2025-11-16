/**
 * Grading API Endpoint
 * Manage assignment grading and submissions
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  gradeSubmission,
  getAssignmentSubmissions,
  getStudentSubmissions,
  exportGradesToLMS,
} from '@/lib/instructor-tools'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const _startTime = Date.now()

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const assignmentId = searchParams.get('assignmentId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (assignmentId) {
      const submissions = await getAssignmentSubmissions(
        assignmentId,
        (status as "submitted" | "graded" | "returned" | "late" | undefined) || undefined
      )
      
      return NextResponse.json({
        success: true,
        data: submissions,
        count: submissions.length,
      })
    }

    if (studentId) {
      const submissions = await getStudentSubmissions(studentId)
      
      return NextResponse.json({
        success: true,
        data: submissions,
        count: submissions.length,
      })
    }

    return NextResponse.json(
      { error: 'Either assignmentId or studentId is required' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error retrieving submissions:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/grading',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve submissions'
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const action = searchParams.get('action')

    if (action === 'export') {
      // Export grades to LMS
      const { courseId, assignmentId, format } = await req.json()
      
      if (!courseId || !assignmentId || !format) {
        return NextResponse.json(
          { error: 'courseId, assignmentId, and format are required' },
          { status: 400 }
        )
      }

      const exported = await exportGradesToLMS(courseId, assignmentId, format)
      
      return NextResponse.json({
        success: true,
        data: exported,
        message: 'Grades exported successfully',
      })
    }

    // Grade a submission
    const { submissionId, grade, rubricScores, feedback, instructorId } = await req.json()

    if (!submissionId || grade === undefined) {
      return NextResponse.json(
        { error: 'submissionId and grade are required' },
        { status: 400 }
      )
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const submission = await gradeSubmission(
      submissionId,
      grade,
      rubricScores,
      feedback,
      instructorId
    )

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/instructor/grading',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: submission,
      message: 'Submission graded successfully',
    })
  } catch (error) {
    console.error('Error grading submission:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/grading',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to grade submission'
      },
      { status: 500 }
    )
  }
}
