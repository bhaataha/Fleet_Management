'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAlerts } from '@/hooks/useAlerts'
import AlertItem from '@/components/alerts/AlertItem'
import { Filter, RefreshCw, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AlertsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('')
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
    limit: 100,
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">התראות</h1>
            <p className="text-gray-600 mt-1">
              {unreadCount} התראות חדשות • {total} סך הכל
            </p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            רענן
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">לא נקראו</p>
                <p className="text-2xl font-bold text-gray-900">{unreadCount}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סך הכל</p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">טופלו</p>
                <p className="text-2xl font-bold text-gray-900">
                  {total - unreadCount}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">סינון</h3>
          </div>
          
          <div className="space-y-3">
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                סטטוס
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: '', label: 'הכל' },
                  { value: 'UNREAD', label: 'לא נקראו' },
                  { value: 'READ', label: 'נקראו' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setStatusFilter(option.value)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      statusFilter === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                חומרה
              </label>
              <div className="flex gap-2 flex-wrap">
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
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                      severityFilter === option.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                קטגוריה
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: '', label: 'הכל' },
                  { value: 'OPERATIONAL', label: 'תפעולי' },
                  { value: 'MAINTENANCE', label: 'תחזוקה' },
                  { value: 'FINANCIAL', label: 'כספי' },
                  { value: 'SYSTEM', label: 'מערכת' },
                  { value: 'REALTIME', label: 'זמן אמת' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setCategoryFilter(option.value)}
                    className={cn(
                      'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
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
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              התראות ({alerts.length})
            </h3>
          </div>
          
          <div className="p-4 space-y-3">
            {loading && alerts.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
              </div>
            ) : error ? (
              <div className="text-center text-red-600 p-8">
                <p className="font-medium">שגיאה בטעינת התראות</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            ) : alerts.length === 0 ? (
              <div className="text-center text-gray-500 p-12">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
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
                />
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
