/**
 * Grade by ID API Endpoint
 * Get and update individual grades
 */

import { NextRequest, NextResponse } from 'next/server'
import { GradeRepository, SubmissionRepository } from '@/lib/db/repositories'
import { createGradeSchema, updateGradeSchema } from '@/lib/db/validation/schemas'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'
import { NotFoundError, ValidationError, ConflictError, RateLimitError, formatErrorResponse } from '@/lib/errors/api-errors'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const gradeRepo = new GradeRepository()
    
    // Treat id as submission ID first
    const grade = await gradeRepo.findBySubmission(params.id)
    
    if (!grade) {
      throw new NotFoundError('Grade', params.id)
    }

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: grade,
    })
  } catch (error) {
    console.error('Error retrieving grade:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'GET',
    })

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details }),
      },
      { status: statusCode }
    )
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = createGradeSchema.safeParse({
      submissionId: params.id,
      ...body,
    })
    
    if (!validationResult.success) {
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const gradeRepo = new GradeRepository()
    const submissionRepo = new SubmissionRepository()
    
    // Check if submission exists
    const submission = await submissionRepo.findById(params.id)
    if (!submission) {
      throw new NotFoundError('Submission', params.id)
    }

    // Check if grade already exists
    const existingGrade = await gradeRepo.findBySubmission(params.id)
    if (existingGrade) {
      throw new ConflictError('Grade already exists for this submission. Use PATCH to update.')
    }

    const data = validationResult.data
    const grade = await gradeRepo.create({
      submissionId: data.submissionId,
      instructorId: data.instructorId,
      score: data.score,
      maxPoints: data.maxPoints,
      feedback: data.feedback,
      rubricScores: data.rubricScores,
    })

    // Update submission status
    await submissionRepo.update(params.id, {
      status: 'GRADED',
    })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: grade,
      message: 'Submission graded successfully',
    }, { status: 201 })
  } catch (error) {
    console.error('Error grading submission:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'POST',
    })

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details }),
      },
      { status: statusCode }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const params = await context.params

  try {
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = updateGradeSchema.safeParse(body)
    if (!validationResult.success) {
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const gradeRepo = new GradeRepository()
    
    // Find grade by submission ID
    const existingGrade = await gradeRepo.findBySubmission(params.id)
    if (!existingGrade) {
      throw new NotFoundError('Grade', params.id)
    }

    const data = validationResult.data
    const updated = await gradeRepo.update(existingGrade.id, {
      score: data.score,
      maxPoints: data.maxPoints,
      feedback: data.feedback,
      rubricScores: data.rubricScores,
    })

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'PATCH',
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Grade updated successfully',
    })
  } catch (error) {
    console.error('Error updating grade:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'PATCH',
    })

    const { error: errorMessage, details, statusCode } = formatErrorResponse(error)
    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        ...(details && { details }),
      },
      { status: statusCode }
    )
  }
}
