'use client'

/**
 * Mobile-optimized navigation component (Phase 3.3.1)
 * Provides touch-friendly navigation with bottom bar pattern
 */

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  FileText,
  BookOpen,
  Settings,
  MoreHorizontal,
} from 'lucide-react'
import { BottomSheet, BottomSheetAction } from '@/components/ui/bottom-sheet'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const mainNavItems: NavItem[] = [
  { label: 'Home', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: 'Documents', href: '/docs', icon: <FileText className="h-5 w-5" /> },
  { label: 'Study', href: '/study', icon: <BookOpen className="h-5 w-5" /> },
  { label: 'Settings', href: '/settings', icon: <Settings className="h-5 w-5" /> },
]

export function MobileNavigation() {
  const pathname = usePathname()
  const [showMore, setShowMore] = React.useState(false)

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
        <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
          {mainNavItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg',
                  'touch-manipulation min-h-[56px] min-w-[56px]',
                  'transition-colors hover:bg-accent active:scale-95',
                  isActive && 'text-primary bg-primary/10'
                )}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg',
              'touch-manipulation min-h-[56px] min-w-[56px]',
              'transition-colors hover:bg-accent active:scale-95'
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Options Bottom Sheet */}
      <BottomSheet
        open={showMore}
        onOpenChange={setShowMore}
        title="More Options"
        description="Access additional features"
      >
        <div className="space-y-2">
          <BottomSheetAction
            icon={<FileText className="h-5 w-5" />}
            label="Templates"
            description="Browse document templates"
            onClick={() => {
              setShowMore(false)
              // Navigate to templates
            }}
          />
          <BottomSheetAction
            icon={<BookOpen className="h-5 w-5" />}
            label="Flashcards"
            description="Review your study cards"
            onClick={() => {
              setShowMore(false)
              // Navigate to flashcards
            }}
          />
          <BottomSheetAction
            icon={<Settings className="h-5 w-5" />}
            label="Help & Support"
            description="Get help using Vibe University"
            onClick={() => {
              setShowMore(false)
              // Navigate to help
            }}
          />
        </div>
      </BottomSheet>
    </>
  )
}

interface MobileSectionHeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
  }
  sticky?: boolean
}

export function MobileSectionHeader({
  title,
  subtitle,
  action,
  sticky = false,
}: MobileSectionHeaderProps) {
  return (
    <div
      className={cn(
        'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3',
        sticky && 'sticky top-0 z-30'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className={cn(
              'px-4 py-2 rounded-lg bg-primary text-primary-foreground',
              'touch-manipulation min-h-[44px]',
              'transition-colors hover:bg-primary/90 active:scale-95'
            )}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
