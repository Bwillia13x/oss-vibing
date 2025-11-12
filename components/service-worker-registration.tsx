'use client'

import { useEffect } from 'react'

/**
 * Phase 3.1.1: Service Worker Registration
 * Registers the service worker for offline support and caching
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Only register service worker in production
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration.scope)
            
            // Check for updates periodically
            setInterval(() => {
              registration.update()
            }, 60000) // Check every minute
          })
          .catch((error) => {
            console.error('Service Worker registration failed:', error)
          })
      })
    }
  }, [])

  return null
}
