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
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] GET /api/instructor/grading/${params.id} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const gradeRepo = new GradeRepository()
    
    console.log(`[${requestId}] Fetching grade for submission: ${params.id}`)
    
    // Treat id as submission ID first
    const grade = await gradeRepo.findBySubmission(params.id)
    
    if (!grade) {
      console.warn(`[${requestId}] Grade not found for submission: ${params.id}`)
      throw new NotFoundError('Grade', params.id)
    }

    const duration = Date.now() - startTime
    console.log(`[${requestId}] GET /api/instructor/grading/${params.id} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'GET',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: grade,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] GET /api/instructor/grading/${params.id} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'GET',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'GET',
      status: 'error',
      requestId,
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
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] POST /api/instructor/grading/${params.id} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = createGradeSchema.safeParse({
      submissionId: params.id,
      ...body,
    })
    
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed`, validationResult.error.flatten().fieldErrors)
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const gradeRepo = new GradeRepository()
    const submissionRepo = new SubmissionRepository()
    
    // Check if submission exists
    const submission = await submissionRepo.findById(params.id)
    if (!submission) {
      console.warn(`[${requestId}] Submission not found: ${params.id}`)
      throw new NotFoundError('Submission', params.id)
    }

    // Check if grade already exists
    const existingGrade = await gradeRepo.findBySubmission(params.id)
    if (existingGrade) {
      console.warn(`[${requestId}] Grade already exists for submission: ${params.id}`)
      throw new ConflictError('Grade already exists for this submission. Use PATCH to update.')
    }

    console.log(`[${requestId}] Creating grade for submission`, {
      submissionId: params.id,
      score: body.score,
      maxPoints: body.maxPoints,
    })

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

    const duration = Date.now() - startTime
    console.log(`[${requestId}] POST /api/instructor/grading/${params.id} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'POST',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: grade,
      message: 'Submission graded successfully',
    }, { status: 201 })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] POST /api/instructor/grading/${params.id} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'POST',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'POST',
      status: 'error',
      requestId,
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
  const requestId = crypto.randomUUID()

  try {
    console.log(`[${requestId}] PATCH /api/instructor/grading/${params.id} - Request started`)
    
    const forwardedFor = req.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'
    
    if (!apiRateLimiter.isAllowed(ip)) {
      console.warn(`[${requestId}] Rate limit exceeded for IP: ${ip}`)
      throw new RateLimitError()
    }

    // Authentication and authorization - instructors and admins only
    const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
    if (authResult instanceof NextResponse) {
      console.log(`[${requestId}] Authentication failed`)
      return authResult
    }

    const body = await req.json()
    
    // Validate input
    const validationResult = updateGradeSchema.safeParse(body)
    if (!validationResult.success) {
      console.warn(`[${requestId}] Validation failed`, validationResult.error.flatten().fieldErrors)
      throw new ValidationError('Invalid input', validationResult.error.flatten().fieldErrors)
    }

    const gradeRepo = new GradeRepository()
    
    // Find grade by submission ID
    const existingGrade = await gradeRepo.findBySubmission(params.id)
    if (!existingGrade) {
      console.warn(`[${requestId}] Grade not found for submission: ${params.id}`)
      throw new NotFoundError('Grade', params.id)
    }

    console.log(`[${requestId}] Updating grade for submission`, {
      submissionId: params.id,
      gradeId: existingGrade.id,
      updates: Object.keys(body),
    })

    const data = validationResult.data
    const updated = await gradeRepo.update(existingGrade.id, {
      score: data.score,
      maxPoints: data.maxPoints,
      feedback: data.feedback,
      rubricScores: data.rubricScores,
    })

    const duration = Date.now() - startTime
    console.log(`[${requestId}] PATCH /api/instructor/grading/${params.id} - Success (${duration}ms)`)

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'PATCH',
      status: 'success',
      requestId,
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Grade updated successfully',
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[${requestId}] PATCH /api/instructor/grading/${params.id} - Error (${duration}ms)`, error)
    
    monitoring.trackError(error as Error, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'PATCH',
      requestId,
    })

    monitoring.trackMetric('api_response_time', duration, {
      endpoint: `/api/instructor/grading/${params.id}`,
      method: 'PATCH',
      status: 'error',
      requestId,
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
