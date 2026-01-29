'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

export default function DynamicManifest() {
  const pathname = usePathname()
  const { user } = useAuth()

  useEffect(() => {
    // Determine if this is a driver-specific page or user is a driver
    const isMobilePath = pathname.startsWith('/mobile')
    const isDriverUser = user && (user.org_role === 'driver' || user.driver_id)
    
    // Choose manifest based on path and user role
    const manifestPath = isMobilePath || isDriverUser ? '/manifest-driver.json' : '/manifest.json'
    
    // Update manifest link in the head
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    
    if (manifestLink) {
      // Update existing manifest link
      if (manifestLink.href !== window.location.origin + manifestPath) {
        manifestLink.href = manifestPath
        console.log('[PWA] Switched to manifest:', manifestPath)
      }
    } else {
      // Create manifest link if it doesn't exist
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      manifestLink.href = manifestPath
      document.head.appendChild(manifestLink)
      console.log('[PWA] Created manifest link:', manifestPath)
    }

    // Update Apple Web App meta tags for driver paths
    if (isMobilePath || isDriverUser) {
      // Update Apple Web App title
      let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement
      if (appleTitle) {
        appleTitle.content = 'TruckFlow נהג'
      } else {
        appleTitle = document.createElement('meta')
        appleTitle.name = 'apple-mobile-web-app-title'
        appleTitle.content = 'TruckFlow נהג'
        document.head.appendChild(appleTitle)
      }

      // Update theme color for driver app
      let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
      if (themeColor) {
        themeColor.content = '#2563eb'  // Driver app blue
      } else {
        themeColor = document.createElement('meta')
        themeColor.name = 'theme-color'
        themeColor.content = '#2563eb'
        document.head.appendChild(themeColor)
      }
    } else {
      // Revert to general app settings
      let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]') as HTMLMetaElement
      if (appleTitle) {
        appleTitle.content = 'TruckFlow'
      }

      let themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement
      if (themeColor) {
        themeColor.content = '#3b82f6'  // General app blue
      }
    }

  }, [pathname, user])

  return null // This component doesn't render anything
}