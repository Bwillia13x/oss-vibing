/**
 * Phase 3.2.1: Global Not Found Page
 * Provides a helpful 404 page
 */

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center space-y-4 max-w-md p-6">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-4xl font-bold">404</h2>
        <h3 className="text-2xl font-semibold">Page Not Found</h3>
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="pt-4">
          <Link href="/">
            <Button>
              Return to Vibe University
            </Button>
          </Link>
        </div>
        <div className="pt-6 text-sm text-muted-foreground">
          <p>Looking for something specific?</p>
          <ul className="mt-2 space-y-1">
            <li>
              <Link href="/" className="hover:underline">
                🏠 Home
              </Link>
            </li>
            <li>
              <Link href="/api/templates" className="hover:underline">
                📚 Templates
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
