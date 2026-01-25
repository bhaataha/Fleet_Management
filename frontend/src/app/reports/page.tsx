'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { TrendingUp, Calendar, FileText, Download, DollarSign } from 'lucide-react'

export default function ReportsPage() {
  const { t } = useI18n()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const reportTypes = [
    {
      title: 'דוח נסיעות יומי',
      description: 'פירוט כל הנסיעות לפי יום',
      icon: Calendar,
      color: 'bg-blue-500',
      endpoint: '/reports/daily-jobs',
      enabled: true
    },
    {
      title: 'דוח רווחיות לפי משאית',
      description: 'ניתוח הכנסות והוצאות לפי משאית',
      icon: TrendingUp,
      color: 'bg-green-500',
      endpoint: '/reports/truck-profitability',
      enabled: false
    },
    {
      title: 'דוח חובות לקוחות',
      description: 'יתרות פתוחות וזמני פירעון',
      icon: DollarSign,
      color: 'bg-orange-500',
      endpoint: '/reports/ar-aging',
      enabled: false
    },
    {
      title: 'דוח סיכום חודשי',
      description: 'סיכום תפעולי וכספי חודשי',
      icon: FileText,
      color: 'bg-purple-500',
      endpoint: '/reports/monthly-summary',
      enabled: false
    }
  ]

  const handleGenerate = (endpoint: string, enabled: boolean) => {
    if (!enabled) {
      alert(`דוח זה יושלם בשלב 2`)
      return
    }
    window.location.href = endpoint
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.reports')}</h1>
          <p className="text-gray-600 mt-1">דוחות ותובנות עסקיות</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">טווח תאריכים</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מתאריך
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                עד תאריך
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                החל מסננים
              </button>
            </div>
          </div>
        </div>

        {/* Report Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reportTypes.map((report, index) => {
            const Icon = report.icon
            return (
              <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${report.color} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 text-${report.color.split('-')[1]}-600`} />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {report.title}
                </h3>
                <p className="text-gray-600 mb-4 text-sm">
                  {report.description}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerate(report.endpoint, report.enabled)}
                    disabled={!report.enabled}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      report.enabled 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4" />
                    {report.enabled ? 'הפק דוח' : 'בקרוב'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Coming Soon */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6 text-center">
          <p className="text-yellow-900">
            📊 <strong>בקרוב:</strong> גרפים אינטראקטיביים, ייצוא Excel/PDF, ושליחה אוטומטית
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
