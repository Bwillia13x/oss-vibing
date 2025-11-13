import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { ChatProvider } from '@/lib/chat-context'
import { CommandLogsStream } from '@/components/commands-logs/commands-logs-stream'
import { ErrorMonitor } from '@/components/error-monitor/error-monitor'
import { SandboxState } from '@/components/modals/sandbox-state'
import { ServiceWorkerRegistration } from '@/components/service-worker-registration'
import { ThemeProvider } from '@/components/theme-provider'
import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { OnboardingTutorial } from '@/components/onboarding-tutorial'
import { PWAInstallPrompt } from '@/components/pwa-install-prompt'
import { FeedbackButton } from '@/components/user-feedback'
import { Toaster } from '@/components/ui/sonner'
import type { ReactNode } from 'react'
import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import './globals.css'

const title = 'Vibe University'
const description = `Unified student workflow IDE: docs, sheets, decks, notes, refs, study — agent-assisted. A comprehensive academic platform that replaces the Office/365 stack for students while maintaining academic integrity through provenance tracking, citation management, and AI-assisted research workflows.`

export const metadata: Metadata = {
  title,
  description,
  // Phase 3.1.1: PWA support
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Vibe University',
  },
  openGraph: {
    images: [
      {
        url: 'https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://assets.vercel.com/image/upload/v1754588799/OSSvibecodingplatform/OG.png',
      },
    ],
  },
}

// Phase 3.1.1 & 3.3.1: Separate viewport export (Next.js 15 requirement) with mobile optimizations
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#000000',
  viewportFit: 'cover', // Phase 3.3.1: Support for devices with notches (iPhone X+)
}

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          <ServiceWorkerRegistration />
          <KeyboardShortcuts />
          <OnboardingTutorial />
          <PWAInstallPrompt />
          <FeedbackButton />
          <Suspense fallback={null}>
            <NuqsAdapter>
              <ChatProvider>
                <ErrorMonitor>{children}</ErrorMonitor>
              </ChatProvider>
            </NuqsAdapter>
          </Suspense>
          <Toaster />
          <CommandLogsStream />
          <SandboxState />
        </ThemeProvider>
      </body>
    </html>
  )
}
