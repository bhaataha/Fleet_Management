'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { statementsApi } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Download, Mail, MessageCircle, ArrowRight, Save } from 'lucide-react'

export default function BillingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const statementId = Number(params.id)

  const [statement, setStatement] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadStatement()
  }, [statementId])

  useEffect(() => {
    if (!statementId) return
    const saved = localStorage.getItem(`billing_notes_${statementId}`)
    if (saved) setNotes(saved)
  }, [statementId])

  const loadStatement = async () => {
    setLoading(true)
    try {
      const res = await statementsApi.list()
      const found = (res.data || []).find((s: any) => s.id === statementId)
      setStatement(found || null)
    } catch (error) {
      console.error('Failed to load statement:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!statementId) return
    setSaving(true)
    try {
      localStorage.setItem(`billing_notes_${statementId}`, notes)
    } finally {
      setSaving(false)
    }
  }

  const customerName = statement?.customer_name || 'לקוח'
  const number = statement?.number || `#${statementId}`
  const total = Number(statement?.total || 0)
  const paid = Number(statement?.paid_amount || 0)
  const balance = Number(statement?.balance || total - paid)

  const periodLabel = useMemo(() => {
    if (!statement?.period_from || !statement?.period_to) return ''
    return `${formatDate(statement.period_from)} - ${formatDate(statement.period_to)}`
  }, [statement])

  const emailBody = useMemo(() => {
    const lines = statement?.lines || []
    const items = lines
      .map((l: any) => `• נסיעה #${l.job_id} | כמות: ${l.qty} | סה"כ: ₪${Number(l.total || 0).toFixed(2)}`)
      .join('\n')
    return `שלום ${customerName},\n\nמצורף סיכום חודשי ${number}\nתקופה: ${periodLabel}\nסה"כ לתשלום: ₪${total.toFixed(2)}\n\nפירוט נסיעות:\n${items}\n\nהערות: ${notes || '-'}\n\nבברכה,\nTruckFlow`
  }, [statement, customerName, number, periodLabel, total, notes])

  const handleEmail = () => {
    const subject = encodeURIComponent(`סיכום חודשי ${number}`)
    const body = encodeURIComponent(emailBody)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(emailBody)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const handleDownloadPdf = async () => {
    if (!statementId) return
    try {
      const res = await statementsApi.downloadPdf(statementId)
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `statement_${number}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download statement PDF:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              type="button"
              onClick={() => router.push('/billing')}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לחיוב וגבייה
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">סיכום חודשי</h1>
            <p className="text-gray-600">{number} • {customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEmail}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              שליחה במייל
            </button>
            <button
              onClick={handleWhatsApp}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              שליחה בוואטסאפ
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              הורדת PDF
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">טוען נתונים...</div>
        ) : !statement ? (
          <div className="text-center py-12 text-gray-500">סיכום לא נמצא</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600">תקופה</div>
                <div className="text-lg font-bold text-gray-900">{periodLabel}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600">סה"כ</div>
                <div className="text-lg font-bold text-gray-900">₪{total.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600">שולם</div>
                <div className="text-lg font-bold text-green-600">₪{paid.toFixed(2)}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-sm text-gray-600">יתרה</div>
                <div className="text-lg font-bold text-orange-600">₪{balance.toFixed(2)}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900">הערות</h3>
                <button
                  onClick={handleSaveNotes}
                  disabled={saving}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  שמור הערות
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="הוסף הערות לסיכום..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-2">הערות נשמרות מקומית בדפדפן.</p>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">פירוט נסיעות</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">נסיעה #</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">תיאור</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">חומר</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">משאית</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">כמות</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">מחיר יחידה</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">סה"כ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {(statement.lines || []).map((line: any) => (
                      <tr key={line.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">#{line.job_id}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{line.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{line.material_name || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{line.truck_plate || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{line.qty}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">₪{Number(line.unit_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900">₪{Number(line.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
