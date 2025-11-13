'use client'

/**
 * Improved navigation header for Phase 3.2.1 UI/UX
 * Provides clear navigation and better user experience
 */

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  Settings,
  HelpCircle,
  Menu,
  X,
  BookOpen,
  FileText,
  PieChart,
  Presentation,
  StickyNote,
  BookMarked,
} from 'lucide-react'

export function NavigationHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navigation = [
    { name: 'Documents', href: '#', icon: FileText, description: 'Write essays and papers' },
    { name: 'Sheets', href: '#', icon: PieChart, description: 'Analyze data' },
    { name: 'Decks', href: '#', icon: Presentation, description: 'Create presentations' },
    { name: 'Notes', href: '#', icon: StickyNote, description: 'Take notes' },
    { name: 'References', href: '#', icon: BookMarked, description: 'Manage citations' },
    { name: 'Courses', href: '#', icon: BookOpen, description: 'View courses' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-14 items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-lg">Vibe University</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navigation.map((item) => (
            <Button
              key={item.name}
              variant="ghost"
              size="sm"
              asChild
              className="flex items-center gap-2"
              title={item.description}
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.name}</span>
              </Link>
            </Button>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Help & Documentation"
            aria-label="Help & Documentation"
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>
          <ThemeToggle />

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
