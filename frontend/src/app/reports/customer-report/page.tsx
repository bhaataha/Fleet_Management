'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Combobox from '@/components/ui/Combobox'
import { useI18n } from '@/lib/i18n'
import { customersApi, jobsApi, sitesApi, materialsApi, driversApi, trucksApi } from '@/lib/api'
import api from '@/lib/api'
import { ArrowRight, Printer, Download, DollarSign, Package, TrendingUp, Calendar, Mail, MessageCircle } from 'lucide-react'
import Link from 'next/link'
import type { Customer, Job, Site, Material } from '@/types'
import { billingUnitLabels } from '@/lib/utils'

// Helper function for date formatting
const formatDate = (dateString: string) => {
  try {
    return new Date(dateString).toLocaleDateString('he-IL')
  } catch {
    return dateString
  }
}

export default function CustomerReportPage() {
  const { t } = useI18n()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(0)
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().setDate(1)).toISOString().split('T')[0]
  )
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  
  const [jobs, setJobs] = useState<Job[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)
  const [pricingData, setPricingData] = useState<any[]>([])
  const [loadingPricing, setLoadingPricing] = useState(false)

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (selectedCustomerId > 0) {
      loadReportData()
    }
  }, [selectedCustomerId, dateFrom, dateTo])

  const loadCustomers = async () => {
    try {
      const response = await customersApi.list()
      setCustomers(response.data)
      if (response.data.length > 0) {
        setSelectedCustomerId(response.data[0].id)
      }
    } catch (error) {
      console.error('Failed to load customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadReportData = async () => {
    setLoading(true)
    setLoadingPricing(true)
    try {
      const [jobsRes, sitesRes, materialsRes] = await Promise.all([
        jobsApi.getAll(),
        sitesApi.getAll(),
        materialsApi.getAll()
      ])

      // Filter jobs by customer and date range
      const filteredJobs = jobsRes.data.filter((job: Job) => {
        if (job.customer_id !== selectedCustomerId) return false
        if (!job.scheduled_date) return false
        const jobDate = new Date(job.scheduled_date).toISOString().split('T')[0]
        return jobDate >= dateFrom && jobDate <= dateTo
      })

      setJobs(filteredJobs)
      setSites(sitesRes.data)
      setMaterials(materialsRes.data)

      // Load pricing for each job
      await loadPricingForJobs(filteredJobs)
    } catch (error) {
      console.error('Failed to load report data:', error)
    } finally {
      setLoading(false)
      setLoadingPricing(false)
    }
  }

  const loadPricingForJobs = async (jobsList: Job[]) => {
    const pricingPromises = jobsList
      .filter((job) => !(job.manual_override_total || job.pricing_total))
      .map(async (job) => {
      try {
        const quantity = typeof (job.actual_qty ?? job.planned_qty) === 'string'
          ? parseFloat(String(job.actual_qty ?? job.planned_qty)) || 0
          : Number(job.actual_qty ?? job.planned_qty) || 0
        
        const response = await api.post('/pricing/quote', {
          customer_id: job.customer_id,
          material_id: job.material_id,
          from_site_id: job.from_site_id || null,
          to_site_id: job.to_site_id || null,
          unit: job.unit,
          quantity,
          wait_hours: 0,
          is_night: false
        })
        return { job_id: job.id, pricing: response.data }
      } catch (error) {
        console.error(`Failed to load pricing for job ${job.id}:`, error)
        return { job_id: job.id, pricing: null }
      }
    })

    const results = await Promise.all(pricingPromises)
    setPricingData(results)
  }

  const getSiteName = (siteId: number | null | undefined) => {
    if (!siteId) return 'לא צוין'
    const site = sites.find(s => s.id === siteId)
    return site?.name || `אתר #${siteId}`
  }

  const getMaterialName = (materialId: number | null | undefined) => {
    if (!materialId) return 'לא צוין'
    const material = materials.find(m => m.id === materialId)
    return material?.name_hebrew || material?.name || `חומר #${materialId}`
  }

  const getJobPricing = (jobId: number) => {
    return pricingData.find(p => p.job_id === jobId)?.pricing
  }

  const toNumber = (value: any) => {
    const num = typeof value === 'string' ? parseFloat(value) : Number(value)
    return Number.isFinite(num) ? num : 0
  }

  const getJobQuantity = (job: Job) => {
    return toNumber(job.actual_qty ?? job.planned_qty)
  }

  const getJobAmountData = (job: Job) => {
    const qty = getJobQuantity(job)
    const storedTotal = toNumber(job.manual_override_total ?? job.pricing_total)
    const breakdown: any = (job as any).pricing_breakdown_json || null
    const quote = getJobPricing(job.id)

    if (storedTotal > 0) {
      const baseAmount = breakdown?.base_amount ?? storedTotal
      const adjustments = toNumber(breakdown?.min_charge_adjustment) +
        toNumber(breakdown?.wait_fee) +
        toNumber(breakdown?.night_surcharge)
      const unitPrice = qty > 0 ? storedTotal / qty : 0
      return { unitPrice, baseAmount, adjustments, total: storedTotal }
    }

    if (quote) {
      const unitPrice = toNumber(quote.details?.unit_price)
      const baseAmount = toNumber(quote.details?.base_amount)
      const adjustments = toNumber(quote.min_charge_adjustment) +
        toNumber(quote.wait_fee) +
        toNumber(quote.night_surcharge)
      const total = toNumber(quote.total)
      return { unitPrice, baseAmount, adjustments, total }
    }

    return { unitPrice: 0, baseAmount: 0, adjustments: 0, total: 0 }
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  // Statistics
  const totalRevenue = jobs.reduce((sum, job) => sum + getJobAmountData(job).total, 0)
  const totalJobs = jobs.length
  const totalQuantity = jobs.reduce((sum, j) => sum + getJobQuantity(j), 0)
  const avgPricePerJob = totalJobs > 0 ? (totalRevenue / totalJobs) : 0

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
    const headers = ['#', 'תאריך', 'מאתר', 'לאתר', 'חומר', 'כמות', 'יחידה', 'מחיר יחידה', 'סכום ביניים', 'תוספות', 'סה"כ']
    const rows = jobs.map(job => {
      const { unitPrice, baseAmount, adjustments, total } = getJobAmountData(job)
      return [
        job.id,
        formatDate(job.scheduled_date),
        getSiteName(job.from_site_id),
        getSiteName(job.to_site_id),
        getMaterialName(job.material_id),
        getJobQuantity(job),
        job.unit,
        unitPrice || 0,
        baseAmount || 0,
        adjustments || 0,
        total || 0
      ]
    })

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const handleExport = () => {
    const csv = buildCsv()
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `customer-report-${selectedCustomer?.name}-${dateFrom}-${dateTo}.csv`
    link.click()
  }

  const handleSendEmail = async () => {
    if (jobs.length === 0) return
    const defaultEmail = selectedCustomer?.email || ''
    const toEmail = window.prompt('לאיזה אימייל לשלוח?', defaultEmail)
    if (!toEmail) return

    try {
      const csv = buildCsv()
      const base64 = encodeBase64('\ufeff' + csv)
      await api.post('/reports/send-email', {
        to_email: toEmail,
        subject: `דוח לקוח ${selectedCustomer?.name || ''} ${dateFrom} - ${dateTo}`,
        body: `מצורף דוח לקוח לתקופה ${dateFrom} עד ${dateTo}.`,
        attachment_filename: `customer-report-${selectedCustomer?.name || 'customer'}-${dateFrom}-${dateTo}.csv`,
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
      if (jobs.length === 0) return
      try {
        const payload = {
          customer_name: selectedCustomer?.name || '',
          period_from: dateFrom,
          period_to: dateTo,
          lines: jobs.map(job => {
            const { unitPrice, total } = getJobAmountData(job)
            return {
              date: formatDate(job.scheduled_date),
              job_id: job.id,
              from_site: getSiteName(job.from_site_id),
              to_site: getSiteName(job.to_site_id),
              material: getMaterialName(job.material_id),
              quantity: String(getJobQuantity(job)),
              unit: job.unit,
              unit_price: unitPrice.toFixed(2),
              total: total.toFixed(2)
            }
          })
        }

        const shareRes = await api.post('/reports/customer-report/share', payload)
        const shareUrl = shareRes.data?.share_url
        const phone = selectedCustomer?.phone || window.prompt('לאיזה מספר לשלוח ב-WhatsApp?', '') || ''
        const clean = phone.replace(/[^0-9]/g, '')
        const message = `דוח לקוח ${selectedCustomer?.name || ''}\nתקופה: ${dateFrom} עד ${dateTo}\nPDF: ${shareUrl}`
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
              <h1 className="text-2xl font-bold text-gray-900">דוח לקוח</h1>
              <p className="text-gray-600 mt-1">פירוט נסיעות ומחירים ללקוח</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSendEmail}
              disabled={jobs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Mail className="w-5 h-5" />
              שלח אימייל
            </button>
            <button
              onClick={handleSendWhatsApp}
              disabled={jobs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MessageCircle className="w-5 h-5" />
              שלח WhatsApp
            </button>
            <button
              onClick={handleExport}
              disabled={jobs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              ייצא ל-CSV
            </button>
            <button
              onClick={handlePrint}
              disabled={jobs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-5 h-5" />
              הדפס
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 print:hidden">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">מסננים</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Combobox
                label="בחר לקוח"
                required
                placeholder="חפש לקוח..."
                options={customers.map(c => ({
                  value: c.id,
                  label: c.name,
                  subLabel: c.vat_id || c.contact_name
                }))}
                value={selectedCustomerId}
                onChange={(value) => setSelectedCustomerId(Number(value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מתאריך</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">עד תאריך</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {selectedCustomerId === 0 ? (
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-6 text-center">
            <p className="text-yellow-800">אנא בחר לקוח כדי להציג את הדוח</p>
          </div>
        ) : (
          <>
            {/* Print Header */}
            <div className="hidden print:block mb-8">
              <h1 className="text-3xl font-bold text-center mb-2">דוח לקוח - {selectedCustomer?.name}</h1>
              <p className="text-center text-gray-600">
                תקופה: {formatDate(dateFrom)} - {formatDate(dateTo)}
              </p>
              {selectedCustomer?.contact_name && (
                <p className="text-center text-gray-600 text-sm mt-1">
                  איש קשר: {selectedCustomer.contact_name} {selectedCustomer.phone && `• ${selectedCustomer.phone}`}
                </p>
              )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">נסיעות</p>
                    <p className="text-2xl font-bold text-blue-600">{totalJobs}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">סה"כ כמות</p>
                    <p className="text-2xl font-bold text-green-600">{totalQuantity.toFixed(1)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">סה"כ לחיוב</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {loadingPricing ? '...' : `₪${totalRevenue.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">ממוצע לנסיעה</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {loadingPricing ? '...' : `₪${avgPricePerJob.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Jobs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">#</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">תאריך</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">מאתר</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">לאתר</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">חומר</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">כמות</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">מחיר יחידה</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">סכום</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">תוספות</th>
                      <th className="px-3 py-2 text-right text-xs font-semibold text-gray-900">סה"כ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loading ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                          טוען נתונים...
                        </td>
                      </tr>
                    ) : jobs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-gray-500">
                          אין נסיעות לתקופה זו
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => {
                        const amountData = getJobAmountData(job)
                        return (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs font-medium text-gray-900">#{job.id}</td>
                            <td className="px-3 py-2 text-xs text-gray-700">
                              {formatDate(job.scheduled_date)}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-700">{getSiteName(job.from_site_id)}</td>
                            <td className="px-3 py-2 text-xs text-gray-700">{getSiteName(job.to_site_id)}</td>
                            <td className="px-3 py-2 text-xs text-gray-700">{getMaterialName(job.material_id)}</td>
                            <td className="px-3 py-2 text-xs text-gray-700 font-medium">
                              {getJobQuantity(job)} {billingUnitLabels[job.unit] || job.unit}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-900">
                              {loadingPricing ? '...' : `₪${amountData.unitPrice.toFixed(2)}`}
                            </td>
                            <td className="px-3 py-2 text-xs text-blue-600 font-medium">
                              {loadingPricing ? '...' : `₪${amountData.baseAmount.toFixed(2)}`}
                            </td>
                            <td className="px-3 py-2 text-xs text-orange-600">
                              {loadingPricing ? '...' : amountData.adjustments > 0 ? `₪${amountData.adjustments.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-green-600 font-bold">
                              {loadingPricing ? '...' : `₪${amountData.total.toFixed(2)}`}
                            </td>
                          </tr>
                        )
                      })
                    )}
                    {!loading && jobs.length > 0 && !loadingPricing && (
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td colSpan={7} className="px-3 py-3 text-sm text-gray-900 text-left">סה"כ</td>
                        <td className="px-3 py-3 text-sm text-blue-600">
                          ₪{jobs.reduce((sum, job) => sum + getJobAmountData(job).baseAmount, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-sm text-orange-600">
                          ₪{jobs.reduce((sum, job) => sum + getJobAmountData(job).adjustments, 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-sm text-green-600">
                          ₪{totalRevenue.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Footer */}
            {!loading && jobs.length > 0 && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">סיכום</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-blue-700 mb-1">סה"כ נסיעות</p>
                    <p className="text-2xl font-bold text-blue-900">{totalJobs}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">סה"כ כמות</p>
                    <p className="text-2xl font-bold text-blue-900">{totalQuantity.toFixed(1)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">סה"כ לחיוב</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {loadingPricing ? '...' : `₪${totalRevenue.toLocaleString()}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 mb-1">ממוצע לנסיעה</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {loadingPricing ? '...' : `₪${avgPricePerJob.toFixed(0)}`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
