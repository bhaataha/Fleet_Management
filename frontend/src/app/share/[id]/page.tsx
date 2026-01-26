'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

/**
 * Share redirect page - redirects /share/{id} to /api/share/{id}
 * This handles legacy WhatsApp links that were sent before the API path fix
 */
export default function ShareRedirectPage() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    if (params.id && typeof params.id === 'string') {
      // Redirect to the correct API endpoint
      window.location.href = `/api/share/${params.id}`
    }
  }, [params.id])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-3 text-gray-600">מפנה לתעודה...</span>
    </div>
  )
}