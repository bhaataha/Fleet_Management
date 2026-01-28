'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import api, { jobsApi, driversApi, trucksApi, sitesApi, materialsApi, customersApi } from '@/lib/api'
import { ArrowRight, Calendar, Download, Printer, TrendingUp, Clock, CheckCircle, AlertCircle, Mail, MessageCircle } from 'lucide-react'
import type { Job, Driver, Truck, Site, Material, Customer } from '@/types'
import { jobStatusLabels, jobStatusColors, billingUnitLabels, formatDate } from '@/lib/utils'
import Link from 'next/link'

export default function DailyJobsReportPage() {
  const router = useRouter()
  const { t } = useI18n()
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [jobs, setJobs] = useState<Job[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [jobsRes, driversRes, trucksRes, sitesRes, materialsRes, customersRes] = await Promise.all([
        jobsApi.getAll(),
        driversApi.getAll(),
        trucksApi.getAll(),
        sitesApi.getAll(),
        materialsApi.getAll(),
        customersApi.getAll(),
      ])
      
      // Filter jobs by selected date
      const filteredJobs = jobsRes.data.filter((job: Job) => {
        if (!job.scheduled_date) return false
        const jobDate = new Date(job.scheduled_date).toISOString().split('T')[0]
        return jobDate === selectedDate
      })
      
      setJobs(filteredJobs)
      setDrivers(driversRes.data)
      setTrucks(trucksRes.data)
      setSites(sitesRes.data)
      setMaterials(materialsRes.data)
      setCustomers(customersRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDriverName = (driverId: number | null | undefined) => {
    if (!driverId) return 'לא משובץ'
    const driver = drivers.find(d => d.id === driverId)
    return driver?.name || `נהג #${driverId}`
  }

  const getTruckPlate = (truckId: number | null | undefined) => {
    if (!truckId) return '-'
    const truck = trucks.find(t => t.id === truckId)
    return truck?.plate_number || `משאית #${truckId}`
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

  const getCustomerName = (customerId: number | null | undefined) => {
    if (!customerId) return 'לא צוין'
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || `לקוח #${customerId}`
  }

  // Statistics
  const stats = {
    total: jobs.length,
    completed: jobs.filter(j => ['DELIVERED', 'CLOSED'].includes(j.status)).length,
    inProgress: jobs.filter(j => ['ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF'].includes(j.status)).length,
    planned: jobs.filter(j => j.status === 'PLANNED').length,
    totalQuantity: jobs.reduce((sum, j) => sum + (Number(j.planned_qty) || 0), 0),
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
    const headers = ['מספר נסיעה', 'לקוח', 'נהג', 'משאית', 'מאתר', 'לאתר', 'חומר', 'כמות', 'יחידה', 'סטטוס']
    const rows = jobs.map(job => [
      job.id,
      getCustomerName(job.customer_id),
      getDriverName(job.driver_id),
      getTruckPlate(job.truck_id),
      getSiteName(job.from_site_id),
      getSiteName(job.to_site_id),
      getMaterialName(job.material_id),
      job.planned_qty,
      job.unit,
      jobStatusLabels[job.status as keyof typeof jobStatusLabels] || job.status
    ])

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  const handleExport = () => {
    const csv = buildCsv()
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }) // BOM for Hebrew
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `daily-jobs-report-${selectedDate}.csv`
    link.click()
  }

  const handleSendEmail = async () => {
    if (jobs.length === 0) return
    const toEmail = window.prompt('לאיזה אימייל לשלוח?', '')
    if (!toEmail) return
    try {
      const csv = buildCsv()
      const base64 = encodeBase64('\ufeff' + csv)
      await api.post('/reports/send-email', {
        to_email: toEmail,
        subject: `דוח נסיעות יומי ${selectedDate}`,
        body: `מצורף דוח נסיעות יומי לתאריך ${selectedDate}.`,
        attachment_filename: `daily-jobs-report-${selectedDate}.csv`,
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
          date: selectedDate,
          lines: jobs.map(job => ({
            job_id: job.id,
            customer: getCustomerName(job.customer_id),
            driver: getDriverName(job.driver_id),
            truck: getTruckPlate(job.truck_id),
            from_site: getSiteName(job.from_site_id),
            to_site: getSiteName(job.to_site_id),
            material: getMaterialName(job.material_id),
            quantity: String(job.planned_qty || 0),
            unit: job.unit,
            status: jobStatusLabels[job.status as keyof typeof jobStatusLabels] || job.status
          }))
        }

        const shareRes = await api.post('/reports/daily-jobs/share', payload)
        const shareUrl = shareRes.data?.share_url
        const phone = window.prompt('לאיזה מספר לשלוח ב-WhatsApp?', '') || ''
        const clean = phone.replace(/[^0-9]/g, '')
        const message = `דוח נסיעות יומי\nתאריך: ${selectedDate}\nPDF: ${shareUrl}`
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
            <Link
              href="/reports"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowRight className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">דוח נסיעות יומי</h1>
              <p className="text-gray-600 mt-1">פירוט מלא של כל הנסיעות</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              שלח אימייל
            </button>
            <button
              onClick={handleSendWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              שלח WhatsApp
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              ייצא ל-CSV
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

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-4 print:hidden">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">תאריך:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">דוח נסיעות יומי</h1>
          <p className="text-center text-gray-600">
            תאריך: {formatDate(selectedDate)}
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סה״כ נסיעות</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">הושלמו</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">בביצוע</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">מתוכנן</p>
                <p className="text-2xl font-bold text-gray-600">{stats.planned}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">סה״כ כמות</p>
                <p className="text-2xl font-bold text-purple-600">{(stats.totalQuantity || 0).toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">#</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">לקוח</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">נהג</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">משאית</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">מאתר</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">לאתר</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">חומר</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">כמות</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      טוען נתונים...
                    </td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                      אין נסיעות לתאריך זה
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">#{job.id}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{getCustomerName(job.customer_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getDriverName(job.driver_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getTruckPlate(job.truck_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getSiteName(job.from_site_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getSiteName(job.to_site_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{getMaterialName(job.material_id)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                        {job.planned_qty} {billingUnitLabels[job.unit] || job.unit}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${jobStatusColors[job.status as keyof typeof jobStatusColors]}`}>
                          {jobStatusLabels[job.status as keyof typeof jobStatusLabels] || job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Footer */}
        {!loading && jobs.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-blue-700 mb-1">סה״כ נסיעות</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">נסיעות שהושלמו</p>
                <p className="text-2xl font-bold text-blue-900">{stats.completed}</p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">אחוז השלמה</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700 mb-1">סה״כ כמות</p>
                <p className="text-2xl font-bold text-blue-900">{(stats.totalQuantity || 0).toFixed(1)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
