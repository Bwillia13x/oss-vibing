'use client'

/**
 * Phase 3.2.1: Global Error Boundary
 * Provides graceful error handling for the entire application
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()
  
  useEffect(() => {
    // Log the error to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md p-6">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-muted-foreground">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        {error.message && (
          <div className="p-3 bg-muted rounded-md text-sm text-left">
            <p className="font-mono">{error.message}</p>
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={reset}
            variant="default"
          >
            Try Again
          </Button>
          <Button
            onClick={() => router.push('/')}
            variant="outline"
          >
            Return Home
          </Button>
        </div>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
