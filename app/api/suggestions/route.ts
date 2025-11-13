import { NextResponse } from 'next/server'
import {
  analyzeContext,
  getSuggestedTemplates,
  getAutoCompleteSuggestions,
  detectCitationStyle,
  getWritingSuggestions,
} from '@/lib/template-suggestions'
import { apiRateLimiter } from '@/lib/cache'
import templatesData from '@/templates/index.json'

/**
 * Smart suggestions API endpoint
 * GET /api/suggestions?type=template&input=research
 * GET /api/suggestions?type=autocomplete&input=create
 * GET /api/suggestions?type=citation&content=...
 * GET /api/suggestions?type=writing&content=...
 */
export async function GET(req: Request) {
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

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const input = searchParams.get('input') || ''
  const content = searchParams.get('content') || ''

  try {
    switch (type) {
      case 'template': {
        // Analyze context and suggest templates
        const context = analyzeContext(input)
        const allTemplates = [
          ...templatesData.templates.docs,
          ...templatesData.templates.sheets,
          ...templatesData.templates.decks,
        ]
        const suggestions = getSuggestedTemplates(allTemplates, context, 5)

        return NextResponse.json({
          context,
          suggestions,
        })
      }

      case 'autocomplete': {
        // Get autocomplete suggestions
        const suggestions = getAutoCompleteSuggestions(input)
        return NextResponse.json({ suggestions })
      }

      case 'citation': {
        // Detect citation style
        const style = detectCitationStyle(content)
        return NextResponse.json({ style })
      }

      case 'writing': {
        // Get writing suggestions
        const suggestions = getWritingSuggestions(content)
        return NextResponse.json({ suggestions })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type. Use: template, autocomplete, citation, or writing' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Suggestions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
