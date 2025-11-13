'use client'

/**
 * Client-side header buttons for help and settings
 */

import { Button } from '@/components/ui/button'
import { HelpCircle, Settings } from 'lucide-react'

export function HeaderButtons() {
  return (
    <>
      {/* TODO: Wire up Help button to open help/documentation dialog */}
      <Button
        variant="ghost"
        size="icon"
        title="Help & Documentation"
        aria-label="Help & Documentation"
        className="hidden md:flex"
        onClick={() => {
          console.log('Help button clicked - TODO: Open help dialog')
        }}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      {/* TODO: Wire up Settings button to open settings dialog */}
      <Button
        variant="ghost"
        size="icon"
        title="Settings"
        aria-label="Settings"
        className="hidden md:flex"
        onClick={() => {
          console.log('Settings button clicked - TODO: Open settings dialog')
        }}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </>
  )
}
