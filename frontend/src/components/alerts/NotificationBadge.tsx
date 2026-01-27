'use client'

import { Bell } from 'lucide-react'
import { useUnreadCount } from '@/hooks/useAlerts'
import { cn } from '@/lib/utils'

interface NotificationBadgeProps {
  onClick?: () => void
  className?: string
}

export default function NotificationBadge({
  onClick,
  className,
}: NotificationBadgeProps) {
  const { count, loading } = useUnreadCount(30000) // Poll every 30 seconds

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-lg hover:bg-gray-100 transition-colors',
        className
      )}
      title={`${count} התראות חדשות`}
    >
      <Bell className="w-5 h-5 text-gray-600" />
      
      {!loading && count > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
