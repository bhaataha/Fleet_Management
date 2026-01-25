'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { customersApi } from '@/lib/api'
import { ArrowRight, Printer, Download, AlertCircle, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import type { Customer } from '@/types'

interface ARAgingData {
  customer_id: number
  customer_name: string
  current: number // 0-30 days
  days_30: number // 31-60 days
  days_60: number // 61-90 days
  days_90: number // 90+ days
  total: number
}

export default function ARAgingReportPage() {
  const { t } = useI18n()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [agingData, setAgingData] = useState<ARAgingData[]>([])
  const [loading, setLoading] = useState(true)
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadData()
  }, [asOfDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const customersRes = await customersApi.list()
      const customersData = customersRes.data

      // TODO: Calculate real aging from statements/invoices table
      // For now, showing empty state until billing module is complete
      const realAging: ARAgingData[] = []

      setCustomers(customersData)
      setAgingData(realAging)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totals = {
    current: agingData.reduce((sum, a) => sum + a.current, 0),
    days_30: agingData.reduce((sum, a) => sum + a.days_30, 0),
    days_60: agingData.reduce((sum, a) => sum + a.days_60, 0),
    days_90: agingData.reduce((sum, a) => sum + a.days_90, 0),
    total: agingData.reduce((sum, a) => sum + a.total, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const headers = ['לקוח', 'שוטף (0-30)', '31-60 יום', '61-90 יום', '90+ יום', 'סה"כ']
    const rows = agingData.map(a => [
      a.customer_name,
      a.current.toFixed(2),
      a.days_30.toFixed(2),
      a.days_60.toFixed(2),
      a.days_90.toFixed(2),
      a.total.toFixed(2)
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ar-aging-${asOfDate}.csv`
    link.click()
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <Link href="/reports" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">דוח חובות לקוחות (A/R Aging)</h1>
              <p className="text-gray-600 mt-1">יתרות פתוחות לפי זמני פירעון</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              ייצא
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Printer className="w-5 h-5" />
              הדפס
            </button>
          </div>
        </div>

        {/* As Of Date */}
        <div className="bg-white rounded-lg shadow p-4 print:hidden">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">נכון ליום:</label>
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">דוח חובות לקוחות</h1>
          <p className="text-center text-gray-600">
            נכון ליום: {new Date(asOfDate).toLocaleDateString('he-IL')}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">שוטף (0-30)</p>
                <p className="text-xl font-bold text-green-600">₪{totals.current.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">31-60 יום</p>
                <p className="text-xl font-bold text-yellow-600">₪{totals.days_30.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">61-90 יום</p>
                <p className="text-xl font-bold text-orange-600">₪{totals.days_60.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">90+ יום</p>
                <p className="text-xl font-bold text-red-600">₪{totals.days_90.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סה"כ</p>
                <p className="text-xl font-bold text-blue-600">₪{totals.total.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Aging Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">לקוח</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">שוטף (0-30)</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">31-60 יום</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">61-90 יום</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">90+ יום</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">סה"כ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      טוען נתונים...
                    </td>
                  </tr>
                ) : agingData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      אין חובות פתוחים
                    </td>
                  </tr>
                ) : (
                  agingData.map((data) => (
                    <tr key={data.customer_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{data.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {data.current > 0 ? `₪${data.current.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-600">
                        {data.days_30 > 0 ? `₪${data.days_30.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-600">
                        {data.days_60 > 0 ? `₪${data.days_60.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">
                        {data.days_90 > 0 ? `₪${data.days_90.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₪{data.total.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && agingData.length > 0 && (
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-3 text-sm text-gray-900">סה"כ</td>
                    <td className="px-4 py-3 text-sm text-green-600">₪{totals.current.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-yellow-600">₪{totals.days_30.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-orange-600">₪{totals.days_60.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-red-600">₪{totals.days_90.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">₪{totals.total.toLocaleString()}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 print:hidden">
          <p className="text-sm text-yellow-800">
            💡 <strong>הערה:</strong> נתונים מדומים להדגמה. במימוש מלא, הנתונים יגיעו מטבלת Statements/Invoices + Payments.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
