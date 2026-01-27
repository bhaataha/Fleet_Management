'use client'

import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  TrendingUp,
  X,
  Check,
} from 'lucide-react'
import type { Alert, AlertSeverity } from '@/types/alert'
import { cn } from '@/lib/utils'

interface AlertItemProps {
  alert: Alert
  onMarkAsRead?: (id: number) => void
  onDismiss?: (id: number) => void
  onResolve?: (id: number) => void
  compact?: boolean
}

const severityConfig: Record<
  AlertSeverity,
  {
    icon: typeof AlertCircle
    color: string
    bgColor: string
    borderColor: string
  }
> = {
  CRITICAL: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  HIGH: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  MEDIUM: {
    icon: Info,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  LOW: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  INFO: {
    icon: Info,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
  },
  SUCCESS: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
  },
}

export default function AlertItem({
  alert,
  onMarkAsRead,
  onDismiss,
  onResolve,
  compact = false,
}: AlertItemProps) {
  const router = useRouter()
  const config = severityConfig[alert.severity]
  const Icon = config.icon

  const handleClick = () => {
    if (!alert.is_read && onMarkAsRead) {
      onMarkAsRead(alert.id)
    }

    if (alert.action_url) {
      router.push(alert.action_url)
    }
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDismiss) {
      onDismiss(alert.id)
    }
  }

  const handleResolve = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onResolve) {
      onResolve(alert.id)
    }
  }

  const timeAgo = formatDistanceToNow(new Date(alert.created_at), {
    addSuffix: true,
    locale: he,
  })

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative border rounded-lg transition-all duration-200',
        config.borderColor,
        config.bgColor,
        alert.is_read ? 'opacity-70' : '',
        alert.action_url ? 'cursor-pointer hover:shadow-md' : '',
        compact ? 'p-3' : 'p-4'
      )}
    >
      {/* Unread indicator */}
      {!alert.is_read && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn('flex-shrink-0', config.color)}>
          <Icon className={compact ? 'w-5 h-5' : 'w-6 h-6'} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4
            className={cn(
              'font-semibold text-gray-900',
              compact ? 'text-sm' : 'text-base'
            )}
          >
            {alert.title}
          </h4>

          {/* Message */}
          <p
            className={cn(
              'text-gray-700 mt-1',
              compact ? 'text-xs' : 'text-sm'
            )}
          >
            {alert.message}
          </p>

          {/* Metadata */}
          <div
            className={cn(
              'flex items-center gap-2 text-gray-500 mt-2',
              compact ? 'text-xs' : 'text-xs'
            )}
          >
            <span>{timeAgo}</span>
            {alert.category && (
              <>
                <span>•</span>
                <span className="capitalize">{alert.category.toLowerCase()}</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Mark as read/unread */}
          {!alert.is_read && onMarkAsRead && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onMarkAsRead(alert.id)
              }}
              className="p-1.5 hover:bg-white/50 rounded transition-colors"
              title="סמן כנקרא"
            >
              <Check className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Resolve */}
          {alert.category === 'OPERATIONAL' && onResolve && (
            <button
              onClick={handleResolve}
              className="p-1.5 hover:bg-white/50 rounded transition-colors"
              title="פתור"
            >
              <CheckCircle className="w-4 h-4 text-green-600" />
            </button>
          )}

          {/* Dismiss */}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="p-1.5 hover:bg-white/50 rounded transition-colors"
              title="התעלם"
            >
              <X className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
