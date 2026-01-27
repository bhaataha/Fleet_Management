import React from 'react'
import './globals.css'
import '../styles/pwa.css'
import type { Metadata, Viewport } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import PWAUpdatePrompt from '@/components/PWAUpdatePrompt'
import OnlineStatus from '@/components/OnlineStatus'
import { Toaster } from 'sonner'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#3b82f6' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
}

export const metadata: Metadata = {
  title: 'TruckFlow - מערכת ניהול צי',
  description: 'מערכת ניהול צי משאיות מקצועית - נסיעות, נהגים, ומשאיות',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TruckFlow',
    startupImage: '/icon-192.svg',
  },
  applicationName: 'TruckFlow',
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.svg" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TruckFlow" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AuthProvider>
          {children}
          <Toaster position="top-center" dir="rtl" />
          <OnlineStatus />
          <PWAInstallPrompt />
          <PWAUpdatePrompt />
        </AuthProvider>
      </body>
    </html>
  )
}
