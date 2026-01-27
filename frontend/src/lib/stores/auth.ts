'use client'

import { create } from 'zustand'
import type { User } from '@/types'
import { usePermissions } from './permissions'

interface AuthStore {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isInitialized: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
  initialize: () => void
}

export const useAuth = create<AuthStore>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,
  
  initialize: () => {
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ user, token, isAuthenticated: true, isInitialized: true })
        
        // Load user permissions only for non-admin users
        // Admin, owner, and super_admin see everything without permission checks
        const isAdminRole = user.org_role === 'admin' || user.org_role === 'owner' || user.is_super_admin
        console.log('👤 Auth initialized:', {
          email: user.email,
          role: user.org_role,
          isAdminRole,
          willLoadPermissions: !isAdminRole
        })
        if (user.id && !isAdminRole) {
          usePermissions.getState().loadPermissions(user.id)
        }
      } catch (e) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        set({ isInitialized: true })
      }
    } else {
      set({ isInitialized: true })
    }
  },
  
  setAuth: (user: User, token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({ user, token, isAuthenticated: true, isInitialized: true })
    
    // Load user permissions only for non-admin users
    const isAdminRole = user.org_role === 'admin' || user.org_role === 'owner' || user.is_super_admin
    if (user.id && !isAdminRole) {
      usePermissions.getState().loadPermissions(user.id)
    }
  },
  
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    }
    usePermissions.getState().clearPermissions()
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
  },
}))
