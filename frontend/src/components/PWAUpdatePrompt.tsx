'use client'

import { RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg)

        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                setShowPrompt(true)
              }
            })
          }
        })
      })
    }
  }, [])

  const handleUpdate = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload page when new service worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-4 flex items-center gap-4 max-w-sm">
        <RefreshCw className="w-5 h-5 text-blue-400 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">
            גרסה חדשה זמינה
          </p>
          <p className="text-xs text-slate-300">
            רענן כדי לקבל את הגרסה העדכנית
          </p>
        </div>

        <button
          onClick={handleUpdate}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex-shrink-0"
        >
          רענן
        </button>
      </div>
    </div>
  )
}
