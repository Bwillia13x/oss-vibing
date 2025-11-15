'use client'

/**
 * Pull-to-refresh component for mobile (Phase 3.3.1)
 * Implements the common mobile pattern for refreshing content
 */

import * as React from 'react'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
  threshold?: number
  disabled?: boolean
}

export function PullToRefresh({
  onRefresh,
  children,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = React.useState(0)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const [startY, setStartY] = React.useState<number | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || isRefreshing) return
    
    const scrollTop = containerRef.current?.scrollTop || 0
    if (scrollTop === 0) {
      setStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY || disabled || isRefreshing) return

    const currentY = e.touches[0].clientY
    const distance = currentY - startY

    // Only pull down from the top
    if (distance > 0) {
      // Apply resistance to the pull
      const resistedDistance = Math.min(distance * 0.5, threshold * 1.5)
      setPullDistance(resistedDistance)
    }
  }

  const handleTouchEnd = async () => {
    if (!startY || disabled || isRefreshing) {
      setPullDistance(0)
      setStartY(null)
      return
    }

    if (pullDistance >= threshold) {
      setIsRefreshing(true)
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
        setStartY(null)
      }
    } else {
      setPullDistance(0)
      setStartY(null)
    }
  }

  const _progress = Math.min((pullDistance / threshold) * 100, 100)
  const shouldTrigger = pullDistance >= threshold

  return (
    <div
      ref={containerRef}
      className="relative h-full overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          'absolute top-0 left-0 right-0 flex items-center justify-center',
          'transition-all duration-200 ease-out',
          'z-10'
        )}
        style={{
          height: `${pullDistance}px`,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
      >
        <div className="flex flex-col items-center gap-2 pb-4">
          <div
            className={cn(
              'rounded-full bg-primary/10 p-3',
              'transition-all duration-200',
              isRefreshing && 'animate-spin'
            )}
          >
            <RefreshCw
              className={cn(
                'h-5 w-5 text-primary transition-transform duration-200',
                shouldTrigger && !isRefreshing && 'rotate-180'
              )}
            />
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            {isRefreshing
              ? 'Refreshing...'
              : shouldTrigger
              ? 'Release to refresh'
              : 'Pull down to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className={cn('transition-transform duration-200')}
        style={{
          transform: `translateY(${pullDistance > 0 ? pullDistance : 0}px)`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
