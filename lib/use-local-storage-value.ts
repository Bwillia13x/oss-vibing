import { useEffect, useState } from 'react'

export function useLocalStorageValue(key: string) {
  const [value, setValue] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || ''
    }
    return ''
  })

  useEffect(() => {
    localStorage.setItem(key, value)
  }, [key, value])

  return [value, setValue] as const
}
