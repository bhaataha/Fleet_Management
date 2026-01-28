'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'

const publicPaths = ['/login', '/signup', '/email-login', '/']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isInitialized, initialize } = useAuth()
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
    
    if (!isAuthenticated && !isPublicPath) {
      router.push('/login')
    }
  }, [isAuthenticated, isInitialized, pathname, router, mounted])

  // Show nothing until initialized to prevent flash
  if (!isInitialized || !mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  }

  return <>{children}</>
}
