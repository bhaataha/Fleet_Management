'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showStatus, setShowStatus] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowStatus(true)
      setTimeout(() => setShowStatus(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowStatus(true)
    }

    // Set initial state
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showStatus) return null

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
      <div className={`${
        isOnline 
          ? 'bg-green-600 text-white' 
          : 'bg-red-600 text-white'
      } px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium`}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>חזרנו לאינטרנט</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>אין חיבור לאינטרנט</span>
          </>
        )}
      </div>
    </div>
  )
}
