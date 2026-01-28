'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'

const publicPaths = ['/login', '/signup', '/email-login', '/']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isInitialized, initialize, user } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Initialize auth from localStorage on mount
  useEffect(() => {
    initialize()
    setMounted(true)
  }, [initialize])

  // Handle redirects after initialization
  useEffect(() => {
    if (!isInitialized || !mounted) return
    
    const isPublicPath = publicPaths.some(path => pathname === path)
    const isMobilePath = pathname.startsWith('/mobile')
    const isDriverRole = user?.org_role === 'driver' || user?.org_role === 'DRIVER'
    const hasDriverRole = Array.isArray(user?.roles) && user?.roles.includes('DRIVER')
    const isDriver = Boolean(isDriverRole || hasDriverRole || user?.driver_id)
    
    if (!isAuthenticated && !isPublicPath) {
      router.push('/login')
      return
    }

    if (isAuthenticated) {
      if (isPublicPath) {
        if (isDriver) {
          router.replace('/mobile/home')
          return
        }
        router.replace('/dashboard')
        return
      }
      if (isDriver && !isMobilePath) {
        router.replace('/mobile/home')
        return
      }
      if (!isDriver && isMobilePath) {
        router.replace('/dashboard')
        return
      }
    }
  }, [isAuthenticated, isInitialized, pathname, router, mounted, user])

  // Show nothing until initialized to prevent flash
  if (!isInitialized || !mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return <>{children}</>
}
