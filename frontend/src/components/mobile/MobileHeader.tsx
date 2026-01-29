'use client'

import { useRouter } from 'next/navigation'
import NotificationBadge from '@/components/alerts/NotificationBadge'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'
import { usePWA } from '@/lib/hooks/usePWA'

export default function MobileHeader() {
  const router = useRouter()

  usePWA()
  usePushNotifications(true)

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">TruckFlow נהג</h1>
        <div className="flex items-center gap-2">
          <NotificationBadge onClick={() => router.push('/mobile/alerts')} />
        </div>
      </div>
    </header>
  )
}
