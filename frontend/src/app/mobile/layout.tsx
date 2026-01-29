import { ReactNode } from 'react'
import type { Metadata } from 'next'
import MobileBottomNav from '@/components/MobileBottomNav'
import MobileHeader from '@/components/mobile/MobileHeader'

export const metadata: Metadata = {
  title: 'TruckFlow Driver',
  description: 'אפליקציית נהג - משימות וסטטוסים בזמן אמת',
  manifest: '/manifest-driver.json',
  applicationName: 'TruckFlow Driver',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TruckFlow Driver',
  },
  formatDetection: {
    telephone: false,
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: '#2563eb',
  icons: {
    icon: '/icon-192.svg',
    apple: '/icon-192.svg',
  },
}

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Mobile Header */}
      <MobileHeader />

      {/* Mobile Content */}
      <main className="p-4">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
