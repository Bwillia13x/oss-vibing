'use client'

/**
 * Landscape orientation support for mobile (Phase 3.3.1)
 * Provides optimized layouts for landscape mode on mobile devices
 */

import * as React from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LandscapeLayoutProps {
  children: React.ReactNode
  showRotatePrompt?: boolean
  splitView?: boolean
}

export function LandscapeLayout({
  children,
  showRotatePrompt = false,
  splitView = false,
}: LandscapeLayoutProps) {
  const [isLandscape, setIsLandscape] = React.useState(false)
  const [showPrompt, setShowPrompt] = React.useState(false)

  React.useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.matchMedia('(orientation: landscape)').matches
      const isMobile = window.innerWidth < 768 // Mobile breakpoint
      
      setIsLandscape(landscape && isMobile)
      
      if (showRotatePrompt && landscape && isMobile) {
        setShowPrompt(true)
        setTimeout(() => setShowPrompt(false), 3000)
      }
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [showRotatePrompt])

  return (
    <div className={cn('relative h-full', isLandscape && 'landscape-mode')}>
      {/* Rotation prompt */}
      {showPrompt && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top">
          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 shadow-lg flex items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            <span className="text-sm font-medium">Landscape mode active</span>
          </div>
        </div>
      )}

      {/* Content with landscape optimizations */}
      <div
        className={cn(
          'h-full',
          isLandscape && splitView && 'landscape-split-view'
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function useLandscapeOrientation() {
  const [isLandscape, setIsLandscape] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkOrientation = () => {
      const landscape = window.matchMedia('(orientation: landscape)').matches
      const mobile = window.innerWidth < 768
      
      setIsLandscape(landscape)
      setIsMobile(mobile)
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  return { isLandscape, isMobile, isLandscapeMobile: isLandscape && isMobile }
}
