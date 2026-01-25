'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { customersApi, jobsApi, sitesApi, materialsApi, driversApi, trucksApi } from '@/lib/api'
import api from '@/lib/api'
import { ArrowRight, Printer, Download, DollarSign, Package, TrendingUp, Calendar } from 'lucide-react'
import Link from 'next/link'
import type { Customer, Job, Site, Material } from '@/types'

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
    const pricingPromises = jobsList.map(async (job) => {
      try {
        const response = await api.post('/pricing/quote', {
          customer_id: job.customer_id,
          material_id: job.material_id,
          from_site_id: job.from_site_id || null,
          to_site_id: job.to_site_id || null,
          unit: job.unit,
          quantity: parseFloat(job.planned_qty),
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

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)

  // Statistics
  const totalRevenue = pricingData.reduce((sum, p) => sum + (p.pricing?.total || 0), 0)
  const totalJobs = jobs.length
  const totalQuantity = jobs.reduce((sum, j) => sum + (Number(j.planned_qty) || 0), 0)
  const avgPricePerJob = totalJobs > 0 ? totalRevenue / totalJobs : 0

  const handlePrint = () => {
    window.print()
  }

  const handleExport = () => {
    const headers = ['#', 'תאריך', 'מאתר', 'לאתר', 'חומר', 'כמות', 'יחידה', 'מחיר יחידה', 'סכום ביניים', 'תוספות', 'סה"כ']
    const rows = jobs.map(job => {
      const pricing = getJobPricing(job.id)
      return [
        job.id,
        new Date(job.scheduled_date).toLocaleDateString('he-IL'),
        getSiteName(job.from_site_id),
        getSiteName(job.to_site_id),
        getMaterialName(job.material_id),
        job.planned_qty,
        job.unit,
        pricing?.details?.unit_price || 0,
        pricing?.details?.base_amount || 0,
        (pricing?.min_charge_adjustment || 0) + (pricing?.wait_fee || 0) + (pricing?.night_surcharge || 0),
        pricing?.total || 0
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `customer-report-${selectedCustomer?.name}-${dateFrom}-${dateTo}.csv`
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
              <h1 className="text-2xl font-bold text-gray-900">דוח לקוח</h1>
              <p className="text-gray-600 mt-1">פירוט נסיעות ומחירים ללקוח</p>
            </div>
          </div>
          <div className="flex gap-3">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                בחר לקוח <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="0">בחר לקוח</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
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
                תקופה: {new Date(dateFrom).toLocaleDateString('he-IL')} - {new Date(dateTo).toLocaleDateString('he-IL')}
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
                        const pricing = getJobPricing(job.id)
                        const adjustments = (pricing?.min_charge_adjustment || 0) + 
                                          (pricing?.wait_fee || 0) + 
                                          (pricing?.night_surcharge || 0)
                        return (
                          <tr key={job.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-xs font-medium text-gray-900">#{job.id}</td>
                            <td className="px-3 py-2 text-xs text-gray-700">
                              {new Date(job.scheduled_date).toLocaleDateString('he-IL')}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-700">{getSiteName(job.from_site_id)}</td>
                            <td className="px-3 py-2 text-xs text-gray-700">{getSiteName(job.to_site_id)}</td>
                            <td className="px-3 py-2 text-xs text-gray-700">{getMaterialName(job.material_id)}</td>
                            <td className="px-3 py-2 text-xs text-gray-700 font-medium">
                              {job.planned_qty} {job.unit}
                            </td>
                            <td className="px-3 py-2 text-xs text-gray-900">
                              {loadingPricing ? '...' : pricing ? `₪${Number(pricing.details?.unit_price || 0).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-blue-600 font-medium">
                              {loadingPricing ? '...' : pricing ? `₪${Number(pricing.details?.base_amount || 0).toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-orange-600">
                              {loadingPricing ? '...' : adjustments > 0 ? `₪${adjustments.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-3 py-2 text-xs text-green-600 font-bold">
                              {loadingPricing ? '...' : pricing ? `₪${Number(pricing.total || 0).toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                    {!loading && jobs.length > 0 && !loadingPricing && (
                      <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                        <td colSpan={7} className="px-3 py-3 text-sm text-gray-900 text-left">סה"כ</td>
                        <td className="px-3 py-3 text-sm text-blue-600">
                          ₪{Number(pricingData.reduce((sum, p) => sum + (p.pricing?.details?.base_amount || 0), 0)).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-sm text-orange-600">
                          ₪{Number(pricingData.reduce((sum, p) => {
                            const pricing = p.pricing
                            const adjustments = (pricing?.min_charge_adjustment || 0) + 
                                   (pricing?.wait_fee || 0) + 
                                   (pricing?.night_surcharge || 0)
                            return sum + adjustments
                          }, 0)).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-sm text-green-600">
                          ₪{Number(totalRevenue || 0).toFixed(2)}
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
