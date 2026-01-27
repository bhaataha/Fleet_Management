'use client'

import { useState, useEffect } from 'react'
import { X, Filter, RefreshCw } from 'lucide-react'
import { useAlerts } from '@/hooks/useAlerts'
import AlertItem from './AlertItem'
import { cn } from '@/lib/utils'
import type { AlertSeverity, AlertCategory } from '@/types/alert'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationPanel({
  isOpen,
  onClose,
}: NotificationPanelProps) {
  const [statusFilter, setStatusFilter] = useState<string>('UNREAD')
  const [severityFilter, setSeverityFilter] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  const {
    alerts,
    total,
    unreadCount,
    loading,
    error,
    markAsRead,
    dismiss,
    resolve,
    refresh,
  } = useAlerts({
    status: statusFilter || undefined,
    severity: severityFilter || undefined,
    category: categoryFilter || undefined,
    limit: 50,
    pollingInterval: 30000,
    enabled: isOpen,
  })

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900">התראות</h2>
            <p className="text-sm text-gray-600">
              {unreadCount} התראות חדשות • {total} סך הכל
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refresh}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              title="רענן"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-white space-y-3">
          {/* Status Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { value: '', label: 'הכל' },
              { value: 'UNREAD', label: 'לא נקראו' },
              { value: 'READ', label: 'נקראו' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  statusFilter === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <span className="text-xs text-gray-500 flex items-center whitespace-nowrap">
              חומרה:
            </span>
            {[
              { value: '', label: 'הכל' },
              { value: 'CRITICAL', label: 'קריטי' },
              { value: 'HIGH', label: 'גבוה' },
              { value: 'MEDIUM', label: 'בינוני' },
              { value: 'LOW', label: 'נמוך' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setSeverityFilter(option.value)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors',
                  severityFilter === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <span className="text-xs text-gray-500 flex items-center whitespace-nowrap">
              קטגוריה:
            </span>
            {[
              { value: '', label: 'הכל' },
              { value: 'OPERATIONAL', label: 'תפעולי' },
              { value: 'MAINTENANCE', label: 'תחזוקה' },
              { value: 'FINANCIAL', label: 'כספי' },
              { value: 'SYSTEM', label: 'מערכת' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setCategoryFilter(option.value)}
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded whitespace-nowrap transition-colors',
                  categoryFilter === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && alerts.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center text-red-600 p-4">
              <p>שגיאה בטעינת התראות</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center text-gray-500 p-8">
              <p className="text-lg font-medium">אין התראות</p>
              <p className="text-sm mt-1">כל ההתראות סומנו כנקראו</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onMarkAsRead={markAsRead}
                onDismiss={dismiss}
                onResolve={resolve}
                compact
              />
            ))
          )}
        </div>
      </div>
    </>
  )
}
