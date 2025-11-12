/**
 * Virtual scrolling hook for Phase 3.1.1 Frontend Performance
 * Optimizes rendering of large lists by only rendering visible items
 */

import { useState, useEffect, useRef, useMemo } from 'react'

interface VirtualScrollOptions {
  itemCount: number
  itemHeight: number
  containerHeight: number
  overscan?: number
}

interface VirtualScrollResult {
  virtualItems: Array<{
    index: number
    start: number
    size: number
  }>
  totalHeight: number
  scrollRef: React.RefObject<HTMLDivElement | null>
}

/**
 * Hook for virtual scrolling large lists
 * Only renders items that are visible in the viewport plus overscan
 */
export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: VirtualScrollOptions): VirtualScrollResult {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = scrollRef.current
    if (!element) return

    const handleScroll = () => {
      setScrollTop(element.scrollTop)
    }

    element.addEventListener('scroll', handleScroll)
    return () => element.removeEventListener('scroll', handleScroll)
  }, [])

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        start: i * itemHeight,
        size: itemHeight,
      })
    }

    return items
  }, [scrollTop, itemCount, itemHeight, containerHeight, overscan])

  const totalHeight = itemCount * itemHeight

  return {
    virtualItems,
    totalHeight,
    scrollRef,
  }
}

