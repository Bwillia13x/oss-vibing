import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import monitoring from '@/lib/monitoring'

/**
 * Phase 4.4.2: Template Rating & Review API
 * Handles template ratings, reviews, and feedback
 */

// Mock ratings database (in production, this would be a real database)
const ratingsDatabase = new Map<
  string,
  Array<{
    id: string
    userId: string
    userName: string
    rating: number
    comment?: string
    helpful: number
    createdAt: Date
    updatedAt: Date
  }>
>()

/**
 * GET /api/templates/ratings
 * Get ratings and reviews for a template
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')
    const sort = searchParams.get('sort') || 'helpful' // helpful, newest, rating
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get ratings for template
    let ratings = ratingsDatabase.get(templateId) || []

    // Sort ratings
    ratings = [...ratings].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'rating':
          return b.rating - a.rating
        case 'helpful':
        default:
          return b.helpful - a.helpful
      }
    })

    // Calculate aggregate stats
    const totalRatings = ratings.length
    const averageRating =
      totalRatings > 0
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings
        : 0
    const ratingDistribution = {
      1: ratings.filter((r) => r.rating === 1).length,
      2: ratings.filter((r) => r.rating === 2).length,
      3: ratings.filter((r) => r.rating === 3).length,
      4: ratings.filter((r) => r.rating === 4).length,
      5: ratings.filter((r) => r.rating === 5).length,
    }

    // Paginate
    const total = ratings.length
    const paginatedRatings = ratings.slice(offset, offset + limit)

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: {
        ratings: paginatedRatings,
        statistics: {
          total: totalRatings,
          average: parseFloat(averageRating.toFixed(2)),
          distribution: ratingDistribution,
        },
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })
  } catch (error) {
    console.error('Template ratings API error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'GET',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/templates/ratings' })

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch ratings',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates/ratings
 * Submit a rating/review for a template
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const { templateId, rating, comment } = body

    // Validate required fields
    if (!templateId || !rating) {
      return NextResponse.json(
        { error: 'Template ID and rating are required' },
        { status: 400 }
      )
    }

    // Validate rating value
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      )
    }

    // Get existing ratings
    const ratings = ratingsDatabase.get(templateId) || []

    // Check if user has already rated this template
    const existingRating = ratings.find((r) => r.userId === user.id)
    if (existingRating) {
      return NextResponse.json(
        { error: 'You have already rated this template. Use PATCH to update.' },
        { status: 409 }
      )
    }

    // Create new rating
    const newRating = {
      id: `rating-${Date.now()}`,
      userId: user.id,
      userName: user.name || 'Anonymous',
      rating,
      comment: comment || undefined,
      helpful: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    ratings.push(newRating)
    ratingsDatabase.set(templateId, ratings)

    // In production, this would:
    // 1. Store rating in database
    // 2. Update template's aggregate rating
    // 3. Trigger notification to template author
    // 4. Update user's review history

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: newRating,
      message: 'Rating submitted successfully',
    })
  } catch (error) {
    console.error('Template rating submission error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'POST',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/templates/ratings' })

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to submit rating',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/templates/ratings
 * Update an existing rating/review
 */
export async function PATCH(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const body = await request.json()
    const { templateId, rating, comment } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get existing ratings
    const ratings = ratingsDatabase.get(templateId) || []

    // Find user's existing rating
    const existingRating = ratings.find((r) => r.userId === user.id)
    if (!existingRating) {
      return NextResponse.json(
        { error: 'You have not rated this template yet. Use POST to create.' },
        { status: 404 }
      )
    }

    // Update rating
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return NextResponse.json(
          { error: 'Rating must be an integer between 1 and 5' },
          { status: 400 }
        )
      }
      existingRating.rating = rating
    }

    if (comment !== undefined) {
      existingRating.comment = comment
    }

    existingRating.updatedAt = new Date()

    ratingsDatabase.set(templateId, ratings)

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'PATCH',
    })

    return NextResponse.json({
      success: true,
      data: existingRating,
      message: 'Rating updated successfully',
    })
  } catch (error) {
    console.error('Template rating update error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'PATCH',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/templates/ratings' })

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to update rating',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/templates/ratings
 * Delete a rating/review
 */
export async function DELETE(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get('templateId')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Get existing ratings
    const ratings = ratingsDatabase.get(templateId) || []

    // Find and remove user's rating
    const index = ratings.findIndex((r) => r.userId === user.id)
    if (index === -1) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      )
    }

    ratings.splice(index, 1)
    ratingsDatabase.set(templateId, ratings)

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'DELETE',
    })

    return NextResponse.json({
      success: true,
      message: 'Rating deleted successfully',
    })
  } catch (error) {
    console.error('Template rating deletion error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/ratings',
      method: 'DELETE',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/templates/ratings' })

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to delete rating',
      },
      { status: 500 }
    )
  }
}
