'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface UsePWAReturn {
  isInstallable: boolean
  isInstalled: boolean
  isOnline: boolean
  promptInstall: () => Promise<void>
  dismissPrompt: () => void
}

export function usePWA(): UsePWAReturn {
  const swVersion = '2.0.4'
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    console.log('[PWA] usePWA hook initializing...')
    
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('[PWA] Already installed (standalone mode detected)')
      setIsInstalled(true)
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('[PWA] beforeinstallprompt event fired!', e)
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      setDeferredPrompt(promptEvent)
      setIsInstallable(true)
      console.log('[PWA] Install prompt available')
    }

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
      console.log('[PWA] App installed')
    }

    // Online/Offline status
    const handleOnline = () => {
      setIsOnline(true)
      console.log('[PWA] Online')
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('[PWA] Offline')
    }

    // Set initial online status
    setIsOnline(navigator.onLine)

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const cleanupServiceWorkers = () => {
      if (!('serviceWorker' in navigator)) return
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => registration.unregister())
      })
      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => caches.delete(cacheName))
        })
      }
    }

    const disablePWA = process.env.NEXT_PUBLIC_DISABLE_PWA === 'true'

    // Register service worker
    if ('serviceWorker' in navigator) {
      console.log('[PWA] ServiceWorker supported, disablePWA:', disablePWA)
      if (disablePWA) {
        console.log('[PWA] PWA disabled, cleaning up service workers')
        cleanupServiceWorkers()
      } else {
        console.log('[PWA] Registering service worker...')
        navigator.serviceWorker
          .register(`/sw.js?v=${swVersion}`)
          .then((registration) => {
            console.log('[PWA] Service Worker registered successfully:', registration)

            // Check for updates every hour
            setInterval(() => {
              registration.update()
            }, 60 * 60 * 1000)

            // Listen for waiting service worker
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available
                    console.log('[PWA] New version available')
                    // You can show a toast here to notify user
                  }
                })
              }
            })
          })
          .catch((error) => {
            console.error('[PWA] Service Worker registration failed:', error)
            cleanupServiceWorkers()
          })
      }
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('[PWA] No install prompt available')
      return
    }

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install')
        setIsInstallable(false)
      } else {
        console.log('[PWA] User dismissed install')
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      console.error('[PWA] Install prompt error:', error)
    }
  }

  const dismissPrompt = () => {
    setIsInstallable(false)
    setDeferredPrompt(null)
  }

  return {
    isInstallable,
    isInstalled,
    isOnline,
    promptInstall,
    dismissPrompt,
  }
}
