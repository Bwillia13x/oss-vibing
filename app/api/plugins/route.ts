import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import monitoring from '@/lib/monitoring'

/**
 * Phase 4.4.1: Plugin Marketplace API
 * Provides plugin discovery, installation, and management
 */

// Mock plugin database (in production, this would be a real database)
const pluginDatabase = [
  {
    metadata: {
      id: 'citation-formatter-plus',
      name: 'Citation Formatter Plus',
      version: '1.0.0',
      description: 'Advanced citation formatting with IEEE and ACS support',
      author: {
        name: 'Vibe University Team',
        email: 'plugins@vibeuniversity.com',
      },
      license: 'MIT',
      keywords: ['citation', 'formatting', 'IEEE', 'ACS'],
      category: 'citation',
      icon: '📚',
    },
    downloads: 1542,
    rating: 4.8,
    reviewCount: 89,
    verified: true,
    featured: true,
    pricing: {
      type: 'free' as const,
    },
    createdAt: new Date('2025-01-15'),
    updatedAt: new Date('2025-11-01'),
  },
  {
    metadata: {
      id: 'markdown-export',
      name: 'Markdown Export',
      version: '1.2.1',
      description: 'Export documents to GitHub-flavored Markdown',
      author: {
        name: 'Community Developer',
        email: 'dev@example.com',
      },
      license: 'MIT',
      keywords: ['export', 'markdown', 'github'],
      category: 'export',
      icon: '📝',
    },
    downloads: 2341,
    rating: 4.5,
    reviewCount: 123,
    verified: true,
    featured: false,
    pricing: {
      type: 'free' as const,
    },
    createdAt: new Date('2025-02-10'),
    updatedAt: new Date('2025-10-20'),
  },
  {
    metadata: {
      id: 'latex-live-preview',
      name: 'LaTeX Live Preview',
      version: '2.0.0',
      description: 'Real-time LaTeX preview with syntax highlighting',
      author: {
        name: 'LaTeX Tools Inc',
        url: 'https://latextools.com',
      },
      license: 'Apache-2.0',
      keywords: ['latex', 'preview', 'math', 'formatting'],
      category: 'formatting',
      icon: '📐',
    },
    downloads: 987,
    rating: 4.9,
    reviewCount: 45,
    verified: true,
    featured: true,
    pricing: {
      type: 'freemium' as const,
      price: 9.99,
      currency: 'USD',
    },
    createdAt: new Date('2025-03-05'),
    updatedAt: new Date('2025-11-10'),
  },
]

/**
 * GET /api/plugins
 * List available plugins from marketplace
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate request
    const authResult = await requireAuth(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const user = authResult

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured') === 'true'
    const verified = searchParams.get('verified') === 'true'
    const sort = searchParams.get('sort') || 'downloads' // downloads, rating, newest
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Filter plugins
    let plugins = [...pluginDatabase]

    if (category) {
      plugins = plugins.filter((p) => p.metadata.category === category)
    }

    if (search) {
      const lowerSearch = search.toLowerCase()
      plugins = plugins.filter(
        (p) =>
          p.metadata.name.toLowerCase().includes(lowerSearch) ||
          p.metadata.description.toLowerCase().includes(lowerSearch) ||
          p.metadata.keywords.some((k) => k.toLowerCase().includes(lowerSearch))
      )
    }

    if (featured) {
      plugins = plugins.filter((p) => p.featured)
    }

    if (verified) {
      plugins = plugins.filter((p) => p.verified)
    }

    // Sort plugins
    plugins.sort((a, b) => {
      switch (sort) {
        case 'rating':
          return b.rating - a.rating
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'downloads':
        default:
          return b.downloads - a.downloads
      }
    })

    // Paginate
    const total = plugins.length
    plugins = plugins.slice(offset, offset + limit)

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/plugins',
      method: 'GET',
    })

    return NextResponse.json({
      success: true,
      data: {
        plugins,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })
  } catch (error) {
    console.error('Plugin API error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/plugins',
      method: 'GET',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/plugins' })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch plugins',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/plugins
 * Install a plugin
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
    const { pluginId, version } = body

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      )
    }

    // Find plugin in database
    const plugin = pluginDatabase.find((p) => p.metadata.id === pluginId)
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    // In production, this would:
    // 1. Download plugin package
    // 2. Validate plugin signature
    // 3. Check compatibility
    // 4. Install to user's plugin directory
    // 5. Register with plugin registry

    // Mock installation
    const installation = {
      pluginId,
      version: version || plugin.metadata.version,
      installedAt: new Date(),
      status: 'installed',
      config: {
        enabled: true,
        permissions: [],
        settings: {},
      },
    }

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/plugins',
      method: 'POST',
    })

    return NextResponse.json({
      success: true,
      data: installation,
      message: `Plugin ${plugin.metadata.name} installed successfully`,
    })
  } catch (error) {
    console.error('Plugin installation error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/plugins',
      method: 'POST',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/plugins' })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to install plugin',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/plugins
 * Uninstall a plugin
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
    const pluginId = searchParams.get('pluginId')

    if (!pluginId) {
      return NextResponse.json(
        { error: 'Plugin ID is required' },
        { status: 400 }
      )
    }

    // Find plugin
    const plugin = pluginDatabase.find((p) => p.metadata.id === pluginId)
    if (!plugin) {
      return NextResponse.json(
        { error: 'Plugin not found' },
        { status: 404 }
      )
    }

    // In production, this would:
    // 1. Deactivate plugin
    // 2. Remove from plugin registry
    // 3. Clean up plugin storage
    // 4. Delete plugin files
    // 5. Update user's installed plugins list

    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/plugins',
      method: 'DELETE',
    })

    return NextResponse.json({
      success: true,
      message: `Plugin ${plugin.metadata.name} uninstalled successfully`,
    })
  } catch (error) {
    console.error('Plugin uninstallation error:', error)
    const duration = Date.now() - startTime
    monitoring.trackMetric('api_response_time', duration, {
      endpoint: '/api/plugins',
      method: 'DELETE',
      error: 'true',
    })
    monitoring.trackError(error as Error, { endpoint: '/api/plugins' })

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to uninstall plugin',
      },
      { status: 500 }
    )
  }
}
