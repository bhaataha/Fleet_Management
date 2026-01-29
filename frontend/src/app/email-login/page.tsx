'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EmailLoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/login?method=email')
  }, [router])

  return null
}