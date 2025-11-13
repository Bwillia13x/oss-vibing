/**
 * Mobile viewport optimization utilities (Phase 3.3.1)
 * Provides helpers for optimal mobile viewport configuration
 */

/**
 * Get optimal viewport meta tag configuration for mobile
 */
export function getMobileViewportConfig() {
  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover', // For devices with notches
  }
}

/**
 * Detect if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
  
  // Check for mobile user agents
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  return mobileRegex.test(userAgent.toLowerCase())
}

/**
 * Detect if the device has touch capability
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )
}

/**
 * Get safe area insets for devices with notches
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined' || typeof getComputedStyle === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 }
  }

  const style = getComputedStyle(document.documentElement)
  
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
  }
}

/**
 * Detect screen size category
 */
export function getScreenSizeCategory(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < 640) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Check if the device is in standalone mode (installed as PWA)
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false
  
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://')
  )
}

/**
 * Get device pixel ratio for high-DPI displays
 */
export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1
  return window.devicePixelRatio || 1
}

/**
 * Detect if the device supports hover (non-touch primary input)
 */
export function supportsHover(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

/**
 * Get optimal touch target size (minimum 44x44 for iOS, 48x48 for Android)
 */
export function getMinTouchTargetSize(): number {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  return isIOS ? 44 : 48
}

/**
 * Prevent zoom on double tap for specific elements
 */
export function preventDoubleTapZoom(element: HTMLElement) {
  let lastTouchEnd = 0
  
  element.addEventListener('touchend', (event) => {
    const now = Date.now()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, { passive: false })
}

/**
 * Lock scroll on mobile (useful for modals)
 */
export function lockScroll(lock: boolean = true) {
  if (typeof document === 'undefined') return
  
  if (lock) {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
  } else {
    const scrollY = document.body.style.top
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, parseInt(scrollY || '0') * -1)
  }
}

/**
 * Get network information for adaptive loading
 */
export function getNetworkInfo() {
  if (typeof navigator === 'undefined' || !(navigator as any).connection) {
    return null
  }
  
  const connection = (navigator as any).connection
  
  return {
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // Round-trip time in ms
    saveData: connection.saveData, // User requested data savings
  }
}

/**
 * Determine if low power mode is likely active (iOS)
 */
export function isLowPowerMode(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for reduced motion preference (often enabled in low power mode)
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  
  // Check for low battery level (if battery API is available)
  const battery = (navigator as any).battery || (navigator as any).getBattery?.()
  const lowBattery = battery && battery.level < 0.2
  
  return reducedMotion || lowBattery
}
