'use client'

/**
 * Bottom sheet UI component for mobile-friendly actions (Phase 3.3.1)
 * Provides a slide-up panel pattern common in mobile apps
 */

import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  title?: string
  description?: string
}

export function BottomSheet({ open, onOpenChange, children, title, description }: BottomSheetProps) {
  const [startY, setStartY] = React.useState<number | null>(null)
  const [currentY, setCurrentY] = React.useState<number | null>(null)
  const sheetRef = React.useRef<HTMLDivElement>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY) return
    const currentTouchY = e.touches[0].clientY
    const diff = currentTouchY - startY
    
    // Only allow dragging down
    if (diff > 0) {
      setCurrentY(diff)
    }
  }

  const handleTouchEnd = () => {
    if (currentY && currentY > 100) {
      // Close if dragged more than 100px
      onOpenChange(false)
    }
    setStartY(null)
    setCurrentY(null)
  }

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background shadow-lg',
          'max-h-[85vh] overflow-y-auto',
          'transition-transform duration-300 ease-out',
          currentY ? '' : 'animate-in slide-in-from-bottom'
        )}
        style={{
          transform: currentY ? `translateY(${currentY}px)` : undefined,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        {(title || description) && (
          <div className="px-6 pb-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                {title && <h2 className="text-xl font-semibold">{title}</h2>}
                {description && (
                  <p className="text-sm text-muted-foreground">{description}</p>
                )}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="ml-4 rounded-full p-2 hover:bg-accent touch-manipulation"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="px-6 pb-8">{children}</div>
      </div>
    </>
  )
}

interface BottomSheetActionProps {
  icon?: React.ReactNode
  label: string
  description?: string
  onClick: () => void
  variant?: 'default' | 'destructive'
}

export function BottomSheetAction({
  icon,
  label,
  description,
  onClick,
  variant = 'default',
}: BottomSheetActionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-lg',
        'touch-manipulation min-h-[64px]',
        'transition-colors hover:bg-accent active:scale-[0.98]',
        variant === 'destructive' && 'text-destructive hover:bg-destructive/10'
      )}
    >
      {icon && <div className="flex-shrink-0">{icon}</div>}
      <div className="flex-1 text-left">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground">{description}</div>
        )}
      </div>
    </button>
  )
}
