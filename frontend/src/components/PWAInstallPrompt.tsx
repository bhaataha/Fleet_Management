'use client'

import { Download, X } from 'lucide-react'
import { usePWA } from '@/lib/hooks/usePWA'
import { useAuth } from '@/components/auth/AuthProvider'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PWAInstallPrompt() {
  const { isInstallable, isInstalled, promptInstall, dismissPrompt } = usePWA()
  const { user } = useAuth()
  const pathname = usePathname()
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  // Determine if this is driver context
  const isMobilePath = pathname.startsWith('/mobile')
  const isDriverUser = user && (user.org_role === 'driver' || user.driver_id)
  const isDriverContext = isMobilePath || isDriverUser

  // Dynamic content based on user context
  const appName = isDriverContext ? 'TruckFlow נהג' : 'TruckFlow'
  const appDescription = isDriverContext 
    ? 'התקן את אפליקציית הנהג למסך הבית לגישה מהירה למשימות ועדכוני סטטוס'
    : 'התקן את האפליקציה למסך הבית לגישה מהירה ופשוטה'

  const benefits = isDriverContext ? [
    'קבלת משימות חדשות בזמן אמת',
    'עדכון סטטוס נסיעות במהירות',
    'עבודה במצב offline',
    'צילום מסמכים וחתימות',
  ] : [
    'פתיחה מהירה ישירות מהמסך הראשי',
    'עבודה במצב offline',
    'התראות בזמן אמת',
    'גישה לכל תכונות המערכת',
  ]

  useEffect(() => {
    // Check if user dismissed before
    const wasDismissed = localStorage.getItem('pwa-install-dismissed')
    if (wasDismissed) {
      const dismissedTime = parseInt(wasDismissed)
      const hoursSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60)
      
      // Show again after 24 hours
      if (hoursSinceDismissed < 24) {
        setDismissed(true)
        return
      }
    }

    // Show prompt after 30 seconds
    if (isInstallable && !isInstalled && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 30000)

      return () => clearTimeout(timer)
    }
  }, [isInstallable, isInstalled, dismissed])

  const handleInstall = async () => {
    await promptInstall()
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    dismissPrompt()
    setShowPrompt(false)
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  if (!showPrompt || isInstalled) {
    return null
  }

  return (
    <>
      {/* Mobile Bottom Sheet */}
      <div className="fixed inset-0 z-50 md:hidden">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleDismiss}
        />
        
        {/* Sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl animate-slide-up">
          <div className="p-6">
            {/* Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-6" />
            
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Download className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">
              התקן את {appName}
            </h3>
            <p className="text-slate-600 text-center mb-6">
              {appDescription}
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-6 text-sm text-slate-600">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleInstall}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3.5 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                התקן עכשיו
              </button>
              <button
                onClick={handleDismiss}
                className="w-full text-slate-600 hover:text-slate-900 font-medium py-2 transition-colors"
              >
                אולי מאוחר יותר
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Toast */}
      <div className="hidden md:block fixed bottom-6 left-6 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm border border-slate-200">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-blue-600" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 mb-1">
                התקן את {appName}
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                {isDriverContext 
                  ? 'התקן את אפליקציית הנהג למחשב לחוויה משופרת' 
                  : 'התקן את האפליקציה למחשב לחוויה משופרת'
                }
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  התקן
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-slate-600 hover:text-slate-900 text-sm font-medium px-2 transition-colors"
                >
                  לא עכשיו
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
