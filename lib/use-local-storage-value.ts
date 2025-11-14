import { useEffect, useState, useRef } from 'react'

export function useLocalStorageValue(key: string) {
  const [value, setValue] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || ''
    }
    return ''
  })
  const isInitialMount = useRef(true)

  useEffect(() => {
    // Skip localStorage update on initial mount since we already read from it
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    localStorage.setItem(key, value)
  }, [key, value])

  return [value, setValue] as const
}
