'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { announce } from '@/lib/accessibility'
import { ShortcutsHelpDialog } from '@/components/shortcuts-help-dialog'

/**
 * Global keyboard shortcuts for Phase 3.2.1 - UI/UX improvements
 * 
 * Keyboard shortcuts:
 * - Ctrl/Cmd + K: Focus search/chat input
 * - Ctrl/Cmd + B: Toggle sidebar visibility (UI integration needed)
 * - Ctrl/Cmd + E: Focus file explorer
 * - Ctrl/Cmd + P: Focus preview panel
 * - Ctrl/Cmd + /: Show keyboard shortcuts help
 * - Ctrl/Cmd + Shift + T: Toggle theme (handled by ThemeToggle component)
 * - Escape: Close modals/dialogs
 */
export function KeyboardShortcuts() {
  const router = useRouter()
  const [showHelp, setShowHelp] = useState(false)

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

      // Ctrl/Cmd + B: Toggle sidebar (UI integration needed)
      if (modKey && e.key === 'b') {
        e.preventDefault()
        const sidebar = document.querySelector('[data-panel-id="sidebar"]') as HTMLElement
        if (sidebar) {
          // Toggle visibility - panel API integration would be better
          sidebar.classList.toggle('hidden')
          const isHidden = sidebar.classList.contains('hidden')
          announce(isHidden ? 'Sidebar hidden' : 'Sidebar shown', 'polite')
        } else {
          announce('Sidebar not found', 'polite')
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
          } else {
            announce('No focusable items in file explorer', 'polite')
          }
        } else {
          announce('File explorer not found', 'polite')
        }
      }

      // Ctrl/Cmd + P: Focus preview panel
      if (modKey && e.key === 'p') {
        e.preventDefault()
        const preview = document.querySelector('[data-component="preview"]') as HTMLElement
        if (preview) {
          // Ensure preview is focusable
          if (!preview.hasAttribute('tabindex')) {
            preview.setAttribute('tabindex', '-1')
          }
          preview.focus()
          announce('Preview panel focused', 'polite')
        } else {
          announce('Preview panel not found', 'polite')
        }
      }

      // Ctrl/Cmd + /: Show shortcuts help
      if (modKey && e.key === '/') {
        e.preventDefault()
        setShowHelp(true)
        announce('Keyboard shortcuts dialog opened', 'polite')
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

  return <ShortcutsHelpDialog open={showHelp} onOpenChange={setShowHelp} />
}
