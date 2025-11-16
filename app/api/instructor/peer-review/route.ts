/**
 * Peer Review API Endpoint
 * Manage peer review workflows
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  createPeerReviews,
  submitPeerReview,
  getPeerReviewsForSubmission
} from '@/lib/instructor-tools'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'
import { requireRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
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
    const submissionId = searchParams.get('submissionId')

    if (!submissionId) {
      return NextResponse.json(
        { error: 'submissionId is required' },
        { status: 400 }
      )
    }

    // Authentication and authorization check
    const authResult = await requireRole(req, ['instructor', 'admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const reviews = await getPeerReviewsForSubmission(submissionId)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/instructor/peer-review',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: reviews,
      count: reviews.length,
    })
  } catch (error) {
    console.error('Error retrieving peer reviews:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/peer-review',
      method: 'GET',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to retrieve peer reviews'
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

    if (action === 'create') {
      // Create peer review assignments
      const { assignmentId, reviewsPerSubmission, isAnonymous } = await req.json()
      
      if (!assignmentId || !reviewsPerSubmission) {
        return NextResponse.json(
          { error: 'assignmentId and reviewsPerSubmission are required' },
          { status: 400 }
        )
      }

      // Authentication and authorization - instructors and admins only
      const authResult = await requireRole(req, ['instructor', 'admin', 'institution-admin'])
      if (authResult instanceof NextResponse) {
        return authResult
      }

      const reviews = await createPeerReviews(
        assignmentId,
        reviewsPerSubmission,
        isAnonymous ?? true
      )

      return NextResponse.json({
        success: true,
        data: reviews,
        count: reviews.length,
        message: 'Peer reviews created successfully',
      })
    }

    // Submit a peer review
    const { reviewId, feedback, rubricScores } = await req.json()

    if (!reviewId || !feedback) {
      return NextResponse.json(
        { error: 'reviewId and feedback are required' },
        { status: 400 }
      )
    }

    // Authentication and authorization check
    const authResult = await requireRole(req, ['student', 'instructor', 'admin'])
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const review = await submitPeerReview(reviewId, feedback, rubricScores)

    monitoring.trackMetric('api_response_time', Date.now() - startTime, {
      endpoint: '/api/instructor/peer-review',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: review,
      message: 'Peer review submitted successfully',
    })
  } catch (error) {
    console.error('Error with peer review:', error)
    
    monitoring.trackError(error as Error, {
      endpoint: '/api/instructor/peer-review',
      method: 'POST',
    })

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process peer review'
      },
      { status: 500 }
    )
  }
}
