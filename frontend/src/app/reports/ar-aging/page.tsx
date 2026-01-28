'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import api, { customersApi, jobsApi } from '@/lib/api'
import { ArrowRight, Printer, Download, AlertCircle, Clock, CheckCircle, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import type { Customer, Job } from '@/types'

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
      const [customersRes, jobsRes] = await Promise.all([
        customersApi.list(),
        jobsApi.getAll()
      ])
      const customersData = customersRes.data
      const jobsData: Job[] = jobsRes.data

      // Calculate aging based on delivered jobs with pricing
      // Group by customer and calculate aging buckets based on job date
      const agingMap = new Map<number, ARAgingData>()
      
      jobsData.forEach((job: Job) => {
        if (!job.customer_id || job.status !== 'DELIVERED' || !job.pricing_total) return
        
        const customer = customersData.find((c: Customer) => c.id === job.customer_id)
        if (!customer) return

        // Calculate days since delivery (simulate invoice date)
        const jobDate = new Date(job.scheduled_date)
        const asOf = new Date(asOfDate)
        const daysSince = Math.floor((asOf.getTime() - jobDate.getTime()) / (1000 * 60 * 60 * 24))
        
        // Convert pricing_total to number
        const amount = typeof job.pricing_total === 'string' 
          ? parseFloat(job.pricing_total) 
          : Number(job.pricing_total)
        
        if (isNaN(amount)) return

        if (!agingMap.has(job.customer_id)) {
          agingMap.set(job.customer_id, {
            customer_id: job.customer_id,
            customer_name: customer.name,
            current: 0,
            days_30: 0,
            days_60: 0,
            days_90: 0,
            total: 0
          })
        }

        const aging = agingMap.get(job.customer_id)!
        
        // Distribute to buckets
        if (daysSince <= 30) {
          aging.current += amount
        } else if (daysSince <= 60) {
          aging.days_30 += amount
        } else if (daysSince <= 90) {
          aging.days_60 += amount
        } else {
          aging.days_90 += amount
        }
        aging.total += amount
      })

      const realAging = Array.from(agingMap.values())
        .filter(a => a.total > 0)
        .sort((a, b) => b.total - a.total)

      setCustomers(customersData)
      setAgingData(realAging)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totals = {
    current: agingData.reduce((sum, a) => {
      const val = typeof a.current === 'string' ? parseFloat(a.current) : Number(a.current)
      return sum + (isNaN(val) ? 0 : val)
    }, 0),
    days_30: agingData.reduce((sum, a) => {
      const val = typeof a.days_30 === 'string' ? parseFloat(a.days_30) : Number(a.days_30)
      return sum + (isNaN(val) ? 0 : val)
    }, 0),
    days_60: agingData.reduce((sum, a) => {
      const val = typeof a.days_60 === 'string' ? parseFloat(a.days_60) : Number(a.days_60)
      return sum + (isNaN(val) ? 0 : val)
    }, 0),
    days_90: agingData.reduce((sum, a) => {
      const val = typeof a.days_90 === 'string' ? parseFloat(a.days_90) : Number(a.days_90)
      return sum + (isNaN(val) ? 0 : val)
    }, 0),
    total: agingData.reduce((sum, a) => {
      const val = typeof a.total === 'string' ? parseFloat(a.total) : Number(a.total)
      return sum + (isNaN(val) ? 0 : val)
    }, 0)
  }

  const handlePrint = () => {
    window.print()
  }

  const encodeBase64 = (text: string) => {
    const bytes = new TextEncoder().encode(text)
    let binary = ''
    bytes.forEach((b) => {
      binary += String.fromCharCode(b)
    })
    return btoa(binary)
  }

  const buildCsv = () => {
    const headers = ['לקוח', 'שוטף (0-30)', '31-60 יום', '61-90 יום', '90+ יום', 'סה"כ']
    const rows = agingData.map(a => [
      a.customer_name,
      a.current.toFixed(2),
      a.days_30.toFixed(2),
      a.days_60.toFixed(2),
      a.days_90.toFixed(2),
      a.total.toFixed(2)
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const handleExport = () => {
    const csv = buildCsv()
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `ar-aging-${asOfDate}.csv`
    link.click()
  }

  const handleSendEmail = async () => {
    if (agingData.length === 0) return
    const toEmail = window.prompt('לאיזה אימייל לשלוח?', '')
    if (!toEmail) return
    try {
      const csv = buildCsv()
      const base64 = encodeBase64('\ufeff' + csv)
      await api.post('/reports/send-email', {
        to_email: toEmail,
        subject: `דוח חובות לקוחות ${asOfDate}`,
        body: `מצורף דוח חובות לקוחות נכון ל-${asOfDate}.`,
        attachment_filename: `ar-aging-${asOfDate}.csv`,
        attachment_mime: 'text/csv',
        attachment_base64: base64
      })
      alert('האימייל נשלח בהצלחה')
    } catch (error: any) {
      const detail = error?.response?.data?.detail || 'שגיאה בשליחת אימייל'
      alert(detail)
    }
  }

  const handleSendWhatsApp = () => {
    const send = async () => {
      if (agingData.length === 0) return
      try {
        const payload = {
          as_of_date: asOfDate,
          lines: agingData.map(a => ({
            customer: a.customer_name,
            current: a.current.toFixed(2),
            days_30: a.days_30.toFixed(2),
            days_60: a.days_60.toFixed(2),
            days_90: a.days_90.toFixed(2),
            total: a.total.toFixed(2)
          }))
        }

        const shareRes = await api.post('/reports/ar-aging/share', payload)
        const shareUrl = shareRes.data?.share_url
        const phone = window.prompt('לאיזה מספר לשלוח ב-WhatsApp?', '') || ''
        const clean = phone.replace(/[^0-9]/g, '')
        const message = `דוח חובות לקוחות\nנכון ליום: ${asOfDate}\nPDF: ${shareUrl}`
        const url = clean.length >= 9
          ? `https://wa.me/972${clean.replace(/^0/, '')}?text=${encodeURIComponent(message)}`
          : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
      } catch (error: any) {
        const detail = error?.response?.data?.detail || 'שגיאה ביצירת קישור PDF'
        alert(detail)
      }
    }
    send()
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
              onClick={handleSendEmail}
              disabled={agingData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Mail className="w-5 h-5" />
              שלח אימייל
            </button>
            <button
              onClick={handleSendWhatsApp}
              disabled={agingData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5" />
              שלח WhatsApp
            </button>
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
                <p className="text-xl font-bold text-green-600">₪{totals.current.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
                <p className="text-xl font-bold text-yellow-600">₪{totals.days_30.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
                <p className="text-xl font-bold text-orange-600">₪{totals.days_60.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
                <p className="text-xl font-bold text-red-600">₪{totals.days_90.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
                <p className="text-xl font-bold text-blue-600">₪{totals.total.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
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
                  agingData.map((data) => {
                    const current = typeof data.current === 'string' ? parseFloat(data.current) : Number(data.current)
                    const days30 = typeof data.days_30 === 'string' ? parseFloat(data.days_30) : Number(data.days_30)
                    const days60 = typeof data.days_60 === 'string' ? parseFloat(data.days_60) : Number(data.days_60)
                    const days90 = typeof data.days_90 === 'string' ? parseFloat(data.days_90) : Number(data.days_90)
                    const total = typeof data.total === 'string' ? parseFloat(data.total) : Number(data.total)
                    
                    return (
                    <tr key={data.customer_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{data.customer_name}</td>
                      <td className="px-4 py-3 text-sm text-green-600">
                        {current > 0 ? `₪${current.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-yellow-600">
                        {days30 > 0 ? `₪${days30.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-orange-600">
                        {days60 > 0 ? `₪${days60.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-red-600 font-medium">
                        {days90 > 0 ? `₪${days90.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        ₪{total.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </td>
                    </tr>
                  )})
                )}
                {!loading && agingData.length > 0 && (
                  <tr className="bg-gray-50 font-bold">
                    <td className="px-4 py-3 text-sm text-gray-900">סה"כ</td>
                    <td className="px-4 py-3 text-sm text-green-600">₪{totals.current.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-sm text-yellow-600">₪{totals.days_30.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-sm text-orange-600">₪{totals.days_60.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-sm text-red-600">₪{totals.days_90.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                    <td className="px-4 py-3 text-sm text-blue-600">₪{totals.total.toLocaleString('he-IL', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Note */}
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4 print:hidden">
          <p className="text-sm text-yellow-800">
            💡 <strong>הערה:</strong> החישוב מבוסס על נסיעות שנמסרו (DELIVERED). במימוש מלא, הנתונים יגיעו מטבלת Statements/Invoices + Payments.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}
