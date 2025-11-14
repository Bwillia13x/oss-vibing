/**
 * Authentication Context
 * Provides user authentication state and institution context
 */

'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface User {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN' | 'INSTRUCTOR'
  institutionId?: string
}

export interface AuthContextType {
  user: User | null
  institutionId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('vibe-auth-user')
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Failed to load user from storage:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = (newUser: User) => {
    setUser(newUser)
    localStorage.setItem('vibe-auth-user', JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('vibe-auth-user')
  }

  const updateUser = (updates: Partial<User>) => {
    if (!user) return
    
    const updatedUser = { ...user, ...updates }
    setUser(updatedUser)
    localStorage.setItem('vibe-auth-user', JSON.stringify(updatedUser))
  }

  const value: AuthContextType = {
    user,
    institutionId: user?.institutionId || null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for requiring authentication
export function useRequireAuth(redirectTo: string = '/auth/login'): AuthContextType {
  const auth = useAuth()
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = redirectTo
    }
  }, [auth.isLoading, auth.isAuthenticated, redirectTo])
  
  return auth
}

// Hook for getting institution ID with fallback
export function useInstitutionId(fallback: string = 'inst_demo'): string {
  const auth = useAuth()
  return auth.institutionId || fallback
}
