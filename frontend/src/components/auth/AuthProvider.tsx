'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'

const publicPaths = ['/login', '/']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const isPublicPath = publicPaths.some(path => pathname === path)
    
    if (!isAuthenticated && !isPublicPath) {
      router.push('/login')
    }
  }, [isAuthenticated, pathname, router])

  return <>{children}</>
}
