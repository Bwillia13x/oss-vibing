/**
 * Phase 3.2.1: Global Loading State
 * Provides a loading indicator while the application initializes
 */

import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="flex h-screen p-2 space-x-2">
      {/* Header skeleton */}
      <div className="absolute top-4 left-4 right-4">
        <Skeleton className="h-12 w-full" />
      </div>

      {/* Main content skeleton */}
      <div className="flex w-full gap-4 pt-20">
        {/* Left panel - Chat */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-12 w-48" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-3/4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>

        {/* Right panel - Preview/Explorer */}
        <div className="flex-1 space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-64 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>

      {/* Loading text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-pulse">🎓</div>
          <p className="text-sm text-muted-foreground">Loading Vibe University...</p>
        </div>
      </div>
    </div>
  )
}
