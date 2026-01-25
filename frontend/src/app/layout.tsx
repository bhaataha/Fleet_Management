import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { AuthProvider } from '@/components/auth/AuthProvider'
import Script from 'next/script'
import UnregisterServiceWorker from '@/components/UnregisterServiceWorker'

export const metadata: Metadata = {
  title: 'Fleet Management - הובלות עפר',
  description: 'מערכת ניהול הובלות עפר',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {/* Unregister old service worker to prevent CORS issues */}
        <Script src="/unregister-sw.js" strategy="beforeInteractive" />
        <UnregisterServiceWorker />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
