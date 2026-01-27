'use client'

import { useDevice } from '@/hooks/useDevice'
import MobileBottomNav from './MobileBottomNav'
import DesktopSidebar from './DesktopSidebar'
import { ReactNode } from 'react'

interface ResponsiveLayoutProps {
  children: ReactNode
}

export default function ResponsiveLayout({ children }: ResponsiveLayoutProps) {
  const { isMobile, isDesktop, isMounted } = useDevice()

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">TruckFlow</h1>
            <div className="flex items-center gap-2">
              {/* Notifications badge */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="p-4">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav />
      </div>
    )
  }

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {/* Desktop Sidebar */}
        <DesktopSidebar />

        {/* Desktop Content */}
        <main className="flex-1 mr-64 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    )
  }

  // Tablet - similar to desktop but with adjustments
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DesktopSidebar />
      <main className="flex-1 mr-64 p-6">
        {children}
      </main>
    </div>
  )
}
