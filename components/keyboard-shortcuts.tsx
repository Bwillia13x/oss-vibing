'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

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
        const chatInput = document.querySelector('textarea[placeholder*="chat"]') as HTMLTextAreaElement
        if (chatInput) {
          chatInput.focus()
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
  const modKey = isMac ? 'Cmd' : 'Ctrl'
  
  const shortcuts = [
    { key: `${modKey} + K`, action: 'Focus chat input' },
    { key: `${modKey} + Shift + T`, action: 'Toggle theme' },
    { key: `${modKey} + /`, action: 'Show keyboard shortcuts' },
    { key: 'Escape', action: 'Close modals' },
  ]

  const message = shortcuts
    .map(({ key, action }) => `${key}: ${action}`)
    .join('\n')

  // Use native alert for simplicity - could be enhanced with a modal component
  alert(`Keyboard Shortcuts:\n\n${message}`)
}
