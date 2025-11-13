import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import monitoring from '@/lib/monitoring'

/**
 * Phase 4.4.2: Template Marketplace API
 * Handles template submissions, ratings, and community contributions
 */

// Mock template database (in production, this would be a real database)
const communityTemplates = [
  {
    id: 'community-resume-modern',
    name: 'Modern Resume Template',
    description: 'Professional resume template with clean design',
    category: 'resume',
    discipline: 'general',
    type: 'docs',
    author: {
      id: 'user123',
      name: 'John Doe',
      verified: true,
    },
    rating: 4.7,
    reviewCount: 234,
    downloads: 5432,
    tags: ['resume', 'professional', 'clean', 'modern'],
    featured: true,
    verified: true,
    pricing: {
      type: 'free' as const,
    },
    preview: '/templates/previews/resume-modern.png',
    createdAt: new Date('2025-09-01'),
    updatedAt: new Date('2025-11-05'),
    status: 'approved',
  },
  {
    id: 'community-newsletter',
    name: 'Academic Newsletter Template',
    description: 'Newsletter template for academic departments and organizations',
    category: 'newsletter',
    discipline: 'general',
    type: 'docs',
    author: {
      id: 'user456',
      name: 'Jane Smith',
      verified: false,
    },
    rating: 4.3,
    reviewCount: 89,
    downloads: 1234,
    tags: ['newsletter', 'academic', 'communication'],
    featured: false,
    verified: false,
    pricing: {
      type: 'free' as const,
    },
    preview: '/templates/previews/newsletter.png',
    createdAt: new Date('2025-10-10'),
    updatedAt: new Date('2025-10-28'),
    status: 'approved',
  },
  {
    id: 'community-grant-proposal',
    name: 'Research Grant Proposal Template',
    description: 'Comprehensive template for NSF-style grant proposals',
    category: 'proposal',
    discipline: 'stem',
    type: 'docs',
    author: {
      id: 'user789',
      name: 'Dr. Sarah Johnson',
      verified: true,
    },
    rating: 4.9,
    reviewCount: 156,
    downloads: 3210,
    tags: ['grant', 'proposal', 'research', 'NSF', 'funding'],
    featured: true,
    verified: true,
    pricing: {
      type: 'premium' as const,
      price: 4.99,
      currency: 'USD',
    },
    preview: '/templates/previews/grant-proposal.png',
    createdAt: new Date('2025-08-15'),
    updatedAt: new Date('2025-11-01'),
    status: 'approved',
  },
]

/**
 * GET /api/templates/marketplace
 * List community-contributed templates
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
    const type = searchParams.get('type') // docs, sheets, decks
    const category = searchParams.get('category')
    const discipline = searchParams.get('discipline')
    const tags = searchParams.get('tags')?.split(',')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const pricing = searchParams.get('pricing') // free, premium
    const sort = searchParams.get('sort') || 'popular' // popular, newest, rating, downloads
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter templates
    let templates = [...communityTemplates]

    if (type) {
      templates = templates.filter((t) => t.type === type)
    }

    if (category) {
      templates = templates.filter((t) => t.category === category)
    }

    if (discipline) {
      templates = templates.filter((t) => t.discipline === discipline)
    }

    if (tags && tags.length > 0) {
      templates = templates.filter((t) =>
        tags.some((tag) => t.tags.includes(tag))
      )
    }

    if (search) {
      const lowerSearch = search.toLowerCase()
      templates = templates.filter(
        (t) =>
          t.name.toLowerCase().includes(lowerSearch) ||
          t.description.toLowerCase().includes(lowerSearch) ||
          t.tags.some((tag) => tag.toLowerCase().includes(lowerSearch))
      )
    }

    if (featured) {
      templates = templates.filter((t) => t.featured)
    }

    if (verified) {
      templates = templates.filter((t) => t.verified)
    }

    if (pricing) {
      templates = templates.filter((t) => t.pricing.type === pricing)
    }

    // Sort templates
    templates.sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'rating':
          return b.rating - a.rating
        case 'downloads':
          return b.downloads - a.downloads
        case 'popular':
        default:
          // Popular = weighted score of rating and downloads
          const scoreA = a.rating * 0.4 + Math.log10(a.downloads + 1) * 0.6
          const scoreB = b.rating * 0.4 + Math.log10(b.downloads + 1) * 0.6
          return scoreB - scoreA
      }
    })

    // Paginate
    const total = templates.length
    templates = templates.slice(offset, offset + limit)

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/marketplace',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: {
        templates,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })
  } catch (error) {
    console.error('Template marketplace API error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/marketplace',
      method: 'GET',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/templates/marketplace' })

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to fetch templates',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/templates/marketplace
 * Submit a new template to the marketplace
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
    const {
      name,
      description,
      category,
      discipline,
      type,
      content,
      tags,
      pricing,
    } = body

    // Validate required fields
    if (!name || !description || !category || !type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['docs', 'sheets', 'decks'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid template type' },
        { status: 400 }
      )
    }

    // Create template submission
    const submission = {
      id: `community-${Date.now()}`,
      name,
      description,
      category,
      discipline: discipline || 'general',
      type,
      author: {
        id: user.id,
        name: user.name,
        verified: user.role === 'instructor' || user.role === 'admin',
      },
      rating: 0,
      reviewCount: 0,
      downloads: 0,
      tags: tags || [],
      featured: false,
      verified: false,
      pricing: pricing || { type: 'free' },
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'pending', // pending, approved, rejected
    }

    // In production, this would:
    // 1. Validate template content
    // 2. Store template in database
    // 3. Queue for review/approval
    // 4. Notify moderators

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/marketplace',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: submission,
      message:
        'Template submitted successfully. It will be reviewed by our team.',
    })
  } catch (error) {
    console.error('Template submission error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/templates/marketplace',
      method: 'POST',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/templates/marketplace' })

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to submit template',
      },
      { status: 500 }
    )
  }
}
