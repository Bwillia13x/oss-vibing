'use client'

/**
 * Client-side header buttons for help and settings
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { HelpCircle, Settings } from 'lucide-react'
import { HelpDialog } from '@/components/help-dialog'
import { SettingsDialog } from '@/components/settings-dialog'

export function HeaderButtons() {
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        title="Help & Documentation"
        aria-label="Help & Documentation"
        className="hidden md:flex"
        onClick={() => setIsHelpOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        title="Settings"
        aria-label="Settings"
        className="hidden md:flex"
        onClick={() => setIsSettingsOpen(true)}
      >
        <Settings className="h-5 w-5" />
      </Button>

      <HelpDialog open={isHelpOpen} onOpenChange={setIsHelpOpen} />
      <SettingsDialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
    </>
  )
}
