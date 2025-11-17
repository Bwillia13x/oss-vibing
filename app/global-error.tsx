'use client'

/**
 * Global Error Boundary
 * Catches errors at the root level of the application
 */

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex h-screen items-center justify-center">
          <div className="text-center space-y-4 max-w-md p-6">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold">Something went wrong!</h2>
            <p className="text-gray-600">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>
            {error.message && (
              <div className="p-3 bg-gray-100 rounded-md text-sm text-left">
                <p className="font-mono">{error.message}</p>
              </div>
            )}
            <button
              onClick={reset}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            {error.digest && (
              <p className="text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </div>
      </body>
    </html>
  )
}
