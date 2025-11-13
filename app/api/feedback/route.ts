import { NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/cache'
import monitoring from '@/lib/monitoring'

/**
 * User feedback collection API for Phase 3.2.1
 * POST /api/feedback - Submit user feedback
 */
export async function POST(req: Request) {
  // Rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for')
  const ip = forwardedFor ? forwardedFor.split(',')[0] : 'anonymous'

  if (!apiRateLimiter.isAllowed(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again later.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': apiRateLimiter.remaining(ip).toString(),
          'Retry-After': '60',
        },
      }
    )
  }

  try {
    const data = await req.json()

    // Validate required fields
    if (!data.rating || typeof data.rating !== 'number' || data.rating < 1 || data.rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5.' },
        { status: 400 }
      )
    }

    // Track feedback metrics
    monitoring.trackMetric('user_feedback_rating', data.rating, {
      hasComment: data.feedback ? 'true' : 'false',
      hasEmail: data.email ? 'true' : 'false',
    })

    // Log feedback (in production, this would go to a database or service)
    console.log('[USER FEEDBACK]', {
      rating: data.rating,
      feedback: data.feedback,
      feature: data.feature,
      email: data.email,
      timestamp: data.timestamp,
      userAgent: data.userAgent,
      url: data.url,
      ip,
    })

    // In production, you would:
    // 1. Store in database
    // 2. Send to analytics service (e.g., Mixpanel, Amplitude)
    // 3. Send notification to team (e.g., Slack, email)
    // 4. Track in CRM if email provided

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback!',
    })
  } catch (error) {
    monitoring.trackError(error as Error, { endpoint: '/api/feedback' })
    return NextResponse.json(
      { error: 'Failed to process feedback' },
      { status: 500 }
    )
  }
}
