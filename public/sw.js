// Phase 3.1.1: Service Worker for Offline Support and Caching
const CACHE_NAME = 'vibe-university-v2'
const STATIC_ASSETS = [
  '/',
  '/globals.css',
  '/manifest.json',
  '/next.svg',
  '/vercel.svg',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Only handle HTTP(S) requests
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Skip API calls (always fetch fresh)
  if (event.request.url.includes('/api/')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update in background
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response)
            })
          }
        }).catch(() => {
          // Silently ignore network errors during background update
        })
        return cachedResponse
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        if (
          !response ||
          response.status !== 200 ||
          response.type === 'error' ||
          response.type === 'opaque'
        ) {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache)
        })

        return response
      })
    })
  )
})
