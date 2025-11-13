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

    // Validate email format if provided
    if (data.email && typeof data.email === 'string' && data.email.trim() !== '') {
      // More strict email regex to avoid ReDoS - limits repetition
      const emailRegex = /^[a-zA-Z0-9._-]{1,64}@[a-zA-Z0-9.-]{1,255}\.[a-zA-Z]{2,}$/
      if (!emailRegex.test(data.email)) {
        return NextResponse.json(
          { error: 'Invalid email format.' },
          { status: 400 }
        )
      }
    }

    // Track feedback metrics
    monitoring.trackMetric('user_feedback_rating', data.rating, {
      hasComment: data.feedback ? 'true' : 'false',
      hasEmail: data.email ? 'true' : 'false',
    })

    // WARNING: Do NOT log sensitive user data (email, IP) in production.
    // The following log redacts sensitive fields. Remove or further secure in production.
    console.log('[USER FEEDBACK]', {
      rating: data.rating,
      feedback: data.feedback,
      feature: data.feature,
      email: data.email ? '[REDACTED]' : undefined,
      timestamp: data.timestamp,
      userAgent: data.userAgent,
      url: data.url,
      ip: ip !== 'anonymous' ? '[REDACTED]' : 'anonymous',
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
