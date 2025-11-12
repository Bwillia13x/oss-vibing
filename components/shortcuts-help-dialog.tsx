'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ShortcutsHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Keyboard shortcuts help dialog
 * Shows all available keyboard shortcuts in a user-friendly format
 */
export function ShortcutsHelpDialog({ open, onOpenChange }: ShortcutsHelpDialogProps) {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac')
  const modKey = isMac ? '⌘' : 'Ctrl'

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { key: `${modKey} + K`, action: 'Focus chat input' },
        { key: `${modKey} + E`, action: 'Focus file explorer' },
        { key: `${modKey} + P`, action: 'Focus preview panel' },
        { key: `${modKey} + B`, action: 'Toggle sidebar' },
      ],
    },
    {
      category: 'Appearance',
      items: [
        { key: `${modKey} + Shift + T`, action: 'Toggle theme (dark/light/system)' },
      ],
    },
    {
      category: 'Help & Utilities',
      items: [
        { key: `${modKey} + /`, action: 'Show keyboard shortcuts help' },
        { key: 'Escape', action: 'Close dialogs and modals' },
      ],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these shortcuts to navigate and control Vibe University more efficiently.
            {isMac ? ' Mac shortcuts use ⌘ (Command) key.' : ' Windows/Linux shortcuts use Ctrl key.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-lg font-semibold mb-3 text-primary">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut) => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <span className="text-sm">{shortcut.action}</span>
                    <kbd className="px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Tip:</strong> All shortcuts are accessible and work with screen readers. 
            Actions are announced for better accessibility.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
