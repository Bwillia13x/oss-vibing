'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { announce } from '@/lib/accessibility'

/**
 * Global keyboard shortcuts for Phase 3.2.1 - UI/UX improvements
 * 
 * Keyboard shortcuts:
 * - Ctrl/Cmd + K: Focus search/chat input
 * - Ctrl/Cmd + B: Toggle sidebar
 * - Ctrl/Cmd + /: Show keyboard shortcuts help
 * - Ctrl/Cmd + Shift + T: Toggle theme (handled by ThemeToggle component)
 * - Escape: Close modals/dialogs
 */
export function KeyboardShortcuts() {
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac')
      const modKey = isMac ? e.metaKey : e.ctrlKey

      // Ctrl/Cmd + K: Focus chat input
      if (modKey && e.key === 'k') {
        e.preventDefault()
        const chatInput = document.querySelector('textarea[placeholder*="message"], input[placeholder*="message"]') as HTMLTextAreaElement | HTMLInputElement
        if (chatInput) {
          chatInput.focus()
          announce('Chat input focused', 'polite')
        }
      }

      // Ctrl/Cmd + /: Show shortcuts help
      if (modKey && e.key === '/') {
        e.preventDefault()
        showShortcutsHelp()
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        const activeDialog = document.querySelector('[role="dialog"]')
        if (activeDialog) {
          const closeButton = activeDialog.querySelector('[aria-label*="close"], [aria-label*="Close"]') as HTMLButtonElement
          if (closeButton) {
            closeButton.click()
            announce('Dialog closed', 'polite')
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router])

  return null
}

function showShortcutsHelp() {
  const isMac = navigator.platform.includes('Mac')
  const modKey = isMac ? '⌘' : 'Ctrl'
  
  const shortcuts = [
    { key: `${modKey} + K`, action: 'Focus chat input' },
    { key: `${modKey} + Shift + T`, action: 'Toggle theme (dark/light)' },
    { key: `${modKey} + /`, action: 'Show this help' },
    { key: 'Escape', action: 'Close dialogs and modals' },
  ]

  const message = shortcuts
    .map(({ key, action }) => `${key}: ${action}`)
    .join('\n')

  // Announce to screen readers
  announce('Keyboard shortcuts dialog opened', 'polite')

  // Use native alert for simplicity - could be enhanced with a modal component
  alert(`Keyboard Shortcuts\n\n${message}\n\nThese shortcuts work throughout the application.`)
}
