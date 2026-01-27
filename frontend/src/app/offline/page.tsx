'use client'

import { WifiOff, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const router = useRouter()
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setTimeout(() => {
        router.push('/')
      }, 1000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check initial state
    setIsOnline(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/')
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className={`p-6 rounded-full ${isOnline ? 'bg-green-100' : 'bg-slate-100'}`}>
            <WifiOff 
              className={`w-16 h-16 ${isOnline ? 'text-green-600' : 'text-slate-400'}`} 
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          {isOnline ? 'חזרנו לאינטרנט!' : 'אין חיבור לאינטרנט'}
        </h1>

        {/* Description */}
        <p className="text-slate-600 mb-6">
          {isOnline 
            ? 'מעבירים אותך לדף הבית...'
            : 'נראה שאתה לא מחובר לאינטרנט. בדוק את החיבור שלך ונסה שוב.'
          }
        </p>

        {/* Status indicator */}
        <div className="mb-6">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-green-600 animate-pulse' : 'bg-slate-400'
            }`} />
            <span className="text-sm font-medium">
              {isOnline ? 'מחובר' : 'לא מחובר'}
            </span>
          </div>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          disabled={!navigator.onLine && !isOnline}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          {isOnline ? 'חזרה לדף הבית' : 'נסה שוב'}
        </button>

        {/* Tips */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3 font-medium">
            טיפים:
          </p>
          <ul className="text-xs text-slate-600 space-y-2 text-right">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>בדוק שה-WiFi או הנתונים הסלולריים פעילים</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>נסה להתחבר לרשת WiFi אחרת</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-0.5">•</span>
              <span>הפעל מחדש את הנתב או המכשיר</span>
            </li>
          </ul>
        </div>

        {/* App info */}
        <div className="mt-6 text-xs text-slate-400">
          TruckFlow PWA • גרסה 1.0.0
        </div>
      </div>
    </div>
  )
}
