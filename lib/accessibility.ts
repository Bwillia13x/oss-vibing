/**
 * Accessibility utilities for Phase 3.2.1 - WCAG 2.1 AA compliance
 * Provides helpers for screen readers, keyboard navigation, and focus management
 */

/**
 * Screen reader only text (visually hidden but accessible)
 */
export function srOnly(text: string): string {
  return text
}

/**
 * Generate unique IDs for accessibility
 */
let idCounter = 0
export function generateId(prefix = 'a11y'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`
}

/**
 * Announce to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document === 'undefined') return

  const existing = document.getElementById('a11y-announcer')
  if (existing) {
    existing.textContent = message
    existing.setAttribute('aria-live', priority)
    return
  }

  const announcer = document.createElement('div')
  announcer.id = 'a11y-announcer'
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', priority)
  announcer.setAttribute('aria-atomic', 'true')
  announcer.className = 'sr-only'
  announcer.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `
  announcer.textContent = message
  document.body.appendChild(announcer)
}

/**
 * Focus management for modals and dialogs
 */
export class FocusTrap {
  private element: HTMLElement
  private previousFocus: HTMLElement | null = null
  private handleKeyDown: (e: KeyboardEvent) => void

  constructor(element: HTMLElement) {
    this.element = element
    this.handleKeyDown = this.trapFocus.bind(this)
  }

  activate(): void {
    this.previousFocus = document.activeElement as HTMLElement
    
    // Focus first focusable element
    const focusable = this.getFocusableElements()
    if (focusable.length > 0) {
      focusable[0].focus()
    }

    this.element.addEventListener('keydown', this.handleKeyDown)
  }

  deactivate(): void {
    this.element.removeEventListener('keydown', this.handleKeyDown)
    
    // Restore previous focus
    if (this.previousFocus) {
      this.previousFocus.focus()
    }
  }

  private trapFocus(e: KeyboardEvent): void {
    if (e.key !== 'Tab') return

    const focusable = this.getFocusableElements()
    if (focusable.length === 0) return

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const current = document.activeElement

    if (e.shiftKey) {
      // Shift + Tab
      if (current === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      // Tab
      if (current === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',')

    return Array.from(this.element.querySelectorAll(selector))
  }
}

/**
 * Check if element is visible to screen readers
 */
export function isAriaHidden(element: HTMLElement): boolean {
  if (element.getAttribute('aria-hidden') === 'true') {
    return true
  }

  const parent = element.parentElement
  return parent ? isAriaHidden(parent) : false
}

/**
 * Get accessible label for element
 */
export function getAccessibleLabel(element: HTMLElement): string {
  // Check aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel

  // Check aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy)
    if (labelElement) return labelElement.textContent || ''
  }

  // Check label element
  if (element instanceof HTMLInputElement) {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label) return label.textContent || ''
  }

  // Check title
  const title = element.getAttribute('title')
  if (title) return title

  // Fallback to text content
  return element.textContent || ''
}

/**
 * Contrast ratio calculator (WCAG 2.1)
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getRelativeLuminance(color1)
  const lum2 = getRelativeLuminance(color2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

function getRelativeLuminance(color: string): number {
  // Parse RGB from color string (simplified)
  const rgb = parseRGB(color)
  const [r, g, b] = rgb.map((val) => {
    val = val / 255
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function parseRGB(color: string): number[] {
  // Simple RGB parser (hex or rgb())
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    return [
      parseInt(hex.slice(0, 2), 16),
      parseInt(hex.slice(2, 4), 16),
      parseInt(hex.slice(4, 6), 16),
    ]
  }
  const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
  if (match) {
    return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])]
  }
  return [0, 0, 0]
}

/**
 * Check WCAG 2.1 AA compliance (4.5:1 for normal text)
 */
export function meetsWCAG_AA(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 4.5
}

/**
 * Check WCAG 2.1 AAA compliance (7:1 for normal text)
 */
export function meetsWCAG_AAA(color1: string, color2: string): boolean {
  return getContrastRatio(color1, color2) >= 7.0
}

/**
 * Keyboard navigation helpers
 */
export const KeyCodes = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const

/**
 * Handle keyboard activation (Enter or Space)
 */
export function isActivationKey(e: KeyboardEvent): boolean {
  return e.key === KeyCodes.ENTER || e.key === KeyCodes.SPACE
}

/**
 * Skip to main content link (for keyboard navigation)
 */
export function createSkipLink(): HTMLElement | null {
  if (typeof document === 'undefined') return null

  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'sr-only focus:not-sr-only'
  skipLink.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    padding: 1rem;
    background: var(--background);
    color: var(--foreground);
    z-index: 9999;
  `

  return skipLink
}
