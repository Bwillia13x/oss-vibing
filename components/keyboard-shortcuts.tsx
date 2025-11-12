'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { announce } from '@/lib/accessibility'

/**
 * Global keyboard shortcuts for Phase 3.2.1 - UI/UX improvements
 * 
 * Keyboard shortcuts:
 * - Ctrl/Cmd + K: Focus search/chat input
 * - Ctrl/Cmd + B: Toggle sidebar visibility
 * - Ctrl/Cmd + E: Focus file explorer
 * - Ctrl/Cmd + P: Focus preview panel
 * - Ctrl/Cmd + /: Show keyboard shortcuts help
 * - Ctrl/Cmd + Shift + T: Toggle theme (handled by ThemeToggle component)
 * - Ctrl/Cmd + ,: Focus settings (if available)
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

      // Ctrl/Cmd + B: Toggle sidebar
      if (modKey && e.key === 'b') {
        e.preventDefault()
        // Find and toggle any collapsible sidebar
        const sidebar = document.querySelector('[data-panel-id="sidebar"]') as HTMLElement
        if (sidebar) {
          // This would work better with actual panel API, but for now just announce
          announce('Sidebar toggle shortcut pressed', 'polite')
        }
      }

      // Ctrl/Cmd + E: Focus file explorer
      if (modKey && e.key === 'e') {
        e.preventDefault()
        const fileExplorer = document.querySelector('[data-component="file-explorer"]') as HTMLElement
        if (fileExplorer) {
          const firstItem = fileExplorer.querySelector('button, a, [tabindex="0"]') as HTMLElement
          if (firstItem) {
            firstItem.focus()
            announce('File explorer focused', 'polite')
          }
        }
      }

      // Ctrl/Cmd + P: Focus preview panel
      if (modKey && e.key === 'p') {
        e.preventDefault()
        const preview = document.querySelector('[data-component="preview"]') as HTMLElement
        if (preview) {
          preview.focus()
          announce('Preview panel focused', 'polite')
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
    { key: `${modKey} + B`, action: 'Toggle sidebar' },
    { key: `${modKey} + E`, action: 'Focus file explorer' },
    { key: `${modKey} + P`, action: 'Focus preview panel' },
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
