'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user: User, token: string) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', token)
        }
        set({ user, token, isAuthenticated: true })
      },
      
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
        }
        set({ user: null, token: null, isAuthenticated: false })
      },
    }),
    {
      name: 'fleet-auth',
    }
  )
)
