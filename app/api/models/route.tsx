import { SUPPORTED_MODELS } from '@/ai/constants'
import { getAvailableModels } from '@/ai/gateway'
import { NextResponse } from 'next/server'
import { apiCache } from '@/lib/cache'
import { perfMonitor } from '@/lib/performance'

// Cache key for available models
const MODELS_CACHE_KEY = 'available_models'

export async function GET() {
  return perfMonitor.time('api.models.get', async () => {
    // Try to get from cache first
    const cached = apiCache.get(MODELS_CACHE_KEY)
    if (cached !== null) {
      return NextResponse.json(cached)
    }

    // Fetch models if not in cache
    const allModels = await getAvailableModels()
    const result = {
      models: allModels.filter((model) => SUPPORTED_MODELS.includes(model.id)),
    }

    // Cache for 5 minutes (default TTL)
    apiCache.set(MODELS_CACHE_KEY, result)

    return NextResponse.json(result)
  })
}
