import { APIError } from '@vercel/sandbox/dist/api-client/api-error'
import { NextRequest, NextResponse } from 'next/server'
import { Sandbox } from '@vercel/sandbox'
import { apiCache } from '@/lib/cache'
import { perfMonitor } from '@/lib/performance'

/**
 * We must change the SDK to add data to the instance and then
 * use it to retrieve the status of the Sandbox.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sandboxId: string }> }
) {
  const { sandboxId } = await params
  
  return perfMonitor.time('api.sandbox.status', async () => {
    // Cache sandbox status for 10 seconds to reduce API calls
    const cacheKey = `sandbox_status_${sandboxId}`
    const cached = apiCache.get(cacheKey)
    if (cached !== null) {
      return NextResponse.json(cached)
    }

    try {
      const sandbox = await Sandbox.get({ sandboxId })
      await sandbox.runCommand({
        cmd: 'echo',
        args: ['Sandbox status check'],
      })
      const result = { status: 'running' }
      
      // Cache for 10 seconds
      apiCache.set(cacheKey, result)
      return NextResponse.json(result)
    } catch (error) {
      if (
        error instanceof APIError &&
        error.json.error.code === 'sandbox_stopped'
      ) {
        const result = { status: 'stopped' }
        // Cache stopped status for 5 seconds
        apiCache.set(cacheKey, result)
        return NextResponse.json(result)
      } else {
        throw error
      }
    }
  }, { sandboxId })
}
