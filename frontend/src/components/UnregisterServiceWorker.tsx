'use client'

import { useEffect } from 'react'

/**
 * Component that forcefully unregisters all service workers
 * to prevent CORS issues in the admin interface
 */
export default function UnregisterServiceWorker() {
  useEffect(() => {
    // Only run in browser
    if (typeof window === 'undefined') return
    
    // Check if service workers are supported
    if ('serviceWorker' in navigator) {
      // Unregister all service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length > 0) {
          console.log('🔧 Found', registrations.length, 'service worker(s), unregistering...')
          
          registrations.forEach((registration) => {
            registration.unregister().then((success) => {
              if (success) {
                console.log('✅ Service Worker unregistered')
              }
            }).catch((error) => {
              console.error('❌ Failed to unregister SW:', error)
            })
          })
          
          // Also clear all caches
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              caches.delete(cacheName)
              console.log('🗑️ Cache deleted:', cacheName)
            })
          })
          
          // Show user message
          console.log('🔄 Service Workers cleared. Please hard refresh (Ctrl+Shift+R) if you still see errors.')
        }
      }).catch((error) => {
        console.error('❌ Error accessing service workers:', error)
      })
    }
  }, [])
  
  return null // This component doesn't render anything
}
