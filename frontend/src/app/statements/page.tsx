'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Plus, FileText, Download, DollarSign } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Statement {
  id: number
  number: string
  customer_id: number
  period_from: string
  period_to: string
  status: string
  subtotal: number
  tax: number
  total: number
}

export default function StatementsPage() {
  const { t } = useI18n()
  const [statements, setStatements] = useState<Statement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStatements()
  }, [])

  const loadStatements = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call
      setStatements([])
    } catch (error) {
      console.error('Failed to load statements:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      DRAFT: { label: 'טיוטה', color: 'bg-gray-100 text-gray-800' },
      SENT: { label: 'נשלח', color: 'bg-blue-100 text-blue-800' },
      PARTIALLY_PAID: { label: 'שולם חלקית', color: 'bg-yellow-100 text-yellow-800' },
      PAID: { label: 'שולם', color: 'bg-green-100 text-green-800' },
    }
    const { label, color } = statusMap[status] || statusMap.DRAFT
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">חשבוניות וסיכומים</h1>
            <p className="text-gray-600 mt-1">ניהול חשבוניות ותשלומים</p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            צור סיכום חדש
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      מספר
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      לקוח
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      תקופה
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      סכום
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      סטטוס
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {statements.map((statement) => (
                    <tr key={statement.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="font-medium text-gray-900">{statement.number}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {statement.customer_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(statement.period_from)} - {formatDate(statement.period_to)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(statement.total)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(statement.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Download className="w-4 h-4" />
                            PDF
                          </button>
                          <button className="text-green-600 hover:text-green-800 flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            תשלום
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {statements.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  אין חשבוניות
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
