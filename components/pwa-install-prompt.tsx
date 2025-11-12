'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Download, X } from 'lucide-react'

/**
 * Phase 3.3.1: PWA Install Prompt
 * Prompts users to install the app as a PWA for better mobile experience
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const isInStandaloneMode = (window.navigator as any).standalone === true
    
    setIsIOS(isIOSDevice)
    
    if (isStandalone || isInStandaloneMode) {
      setIsInstalled(true)
      return
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      // Show again after 7 days
      if (daysSinceDismissed < 7) {
        return
      }
    }

    // Listen for the install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000) // Wait 5 seconds before showing
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Detect iOS devices (they don't support beforeinstallprompt)
    if (isIOSDevice && !isInStandaloneMode) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return
    }

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
    }

    // Clear the prompt
    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    setShowPrompt(false)
  }

  if (isInstalled || !showPrompt) {
    return null
  }

  return (
    <Dialog open={showPrompt} onOpenChange={setShowPrompt}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Install Vibe University
          </DialogTitle>
          <DialogDescription>
            Install our app for a better experience with offline access and faster performance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium mb-2">Benefits:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Access your work offline</li>
              <li>Faster loading times</li>
              <li>Native app-like experience</li>
              <li>Quick access from home screen</li>
            </ul>
          </div>

          {isIOS && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="font-medium mb-1">iOS Installation:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Tap the Share button in Safari</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" to confirm</li>
              </ol>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={handleDismiss}>
              Not now
            </Button>
            {!isIOS && deferredPrompt && (
              <Button onClick={handleInstall}>
                <Download className="h-4 w-4 mr-2" />
                Install
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
