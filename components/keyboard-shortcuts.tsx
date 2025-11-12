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
 * - Ctrl/Cmd + N: New document/artifact
 * - Ctrl/Cmd + S: Save current document
 * - Ctrl/Cmd + Shift + T: Toggle theme (handled by ThemeToggle component)
 * - Ctrl/Cmd + Shift + F: Toggle fullscreen mode
 * - Ctrl/Cmd + Shift + K: Clear chat history
 * - Alt + 1-9: Switch between tabs
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

      // Ctrl/Cmd + N: New document (trigger template browser)
      if (modKey && e.key === 'n') {
        e.preventDefault()
        const newButton = document.querySelector('[aria-label*="New"], [aria-label*="new"]') as HTMLButtonElement
        if (newButton) {
          newButton.click()
          announce('New document dialog opened', 'polite')
        } else {
          announce('New document button not found', 'polite')
        }
      }

      // Ctrl/Cmd + S: Save current document
      if (modKey && e.key === 's') {
        e.preventDefault()
        const saveButton = document.querySelector('[aria-label*="Save"], [aria-label*="save"]') as HTMLButtonElement
        if (saveButton) {
          saveButton.click()
          announce('Document saved', 'polite')
        } else {
          announce('Save triggered', 'polite')
        }
      }

      // Ctrl/Cmd + Shift + F: Toggle fullscreen
      if (modKey && e.shiftKey && e.key === 'F') {
        e.preventDefault()
        if (document.fullscreenElement) {
          document.exitFullscreen()
          announce('Exited fullscreen mode', 'polite')
        } else {
          document.documentElement.requestFullscreen()
          announce('Entered fullscreen mode', 'polite')
        }
      }

      // Ctrl/Cmd + Shift + K: Clear chat history
      if (modKey && e.shiftKey && e.key === 'K') {
        e.preventDefault()
        const clearButton = document.querySelector('[aria-label*="Clear"], [aria-label*="clear"]') as HTMLButtonElement
        if (clearButton) {
          clearButton.click()
          announce('Chat history cleared', 'polite')
        } else {
          announce('Clear chat button not found', 'polite')
        }
      }

      // Alt + 1-9: Switch between tabs
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const num = parseInt(e.key)
        if (num >= 1 && num <= 9) {
          e.preventDefault()
          const tabs = document.querySelectorAll('[role="tab"]')
          if (tabs[num - 1]) {
            (tabs[num - 1] as HTMLElement).click()
            announce(`Switched to tab ${num}`, 'polite')
          }
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
