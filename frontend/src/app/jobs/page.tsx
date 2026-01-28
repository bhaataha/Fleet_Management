'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { jobsApi, sitesApi, materialsApi, driversApi, customersApi, trucksApi, subcontractorsApi } from '@/lib/api'
import { Truck, Calendar, User, Package, Plus, Search, Filter, Building2, FileText, Share2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Job, Site, Material, Driver, Customer, Truck as TruckType } from '@/types'
import { billingUnitLabels, formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  PLANNED: 'bg-gray-100 text-gray-800',
  ASSIGNED: 'bg-blue-100 text-blue-800',
  ENROUTE_PICKUP: 'bg-yellow-100 text-yellow-800',
  LOADED: 'bg-orange-100 text-orange-800',
  ENROUTE_DROPOFF: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CLOSED: 'bg-gray-100 text-gray-600',
  CANCELED: 'bg-red-100 text-red-800',
}

export default function JobsPage() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [subcontractors, setSubcontractors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date())
  const [currentPage, setCurrentPage] = useState(1)
  const [editingJobId, setEditingJobId] = useState<number | null>(null)

  const itemsPerPage = 20

  useEffect(() => {
    loadData()
  }, [statusFilter, dateFrom, dateTo])  // טעינה מחדש כש-dateFrom או dateTo משתנים

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFrom, dateTo, statusFilter])

  // רענון אוטומטי כשהדף נטען (אחרי עריכה/יצירה)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData()
      }
    }
    
    // רענון גם כש-focus חוזר לחלון
    const handleFocus = () => {
      loadData()
    }
    
    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [statusFilter, dateFrom, dateTo])  // מחובר ל-dependencies של loadData

  async function loadData() {
    try {
      setLoading(true)
      
      // חישוב טווח תאריכים: ±10 ימים מהיום (אם לא נבחר ידנית)
      const today = new Date()
      const defaultFromDate = new Date(today)
      defaultFromDate.setDate(today.getDate() - 10)
      const defaultToDate = new Date(today)
      defaultToDate.setDate(today.getDate() + 10)
      
      const params: any = { 
        limit: 1000,  // limit גבוה כי יש סינון תאריכים
        from_date: dateFrom || defaultFromDate.toISOString().split('T')[0],  // YYYY-MM-DD
        to_date: dateTo || defaultToDate.toISOString().split('T')[0]
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      const [jobsRes, sitesRes, materialsRes, driversRes, trucksRes, customersRes, subcontractorsRes] = await Promise.all([
        jobsApi.list(params),
        sitesApi.getAll(),
        materialsApi.getAll(),
        driversApi.getAll(),
        trucksApi.getAll(),
        customersApi.getAll(),
        subcontractorsApi.getAll().catch(() => ({ data: [] })),
      ])
      
      setJobs(jobsRes.data)
      setSites(sitesRes.data)
      setMaterials(materialsRes.data)
      setDrivers(driversRes.data)
      setTrucks(trucksRes.data)
      setCustomers(customersRes.data)
      setSubcontractors(subcontractorsRes.data || subcontractorsRes || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  function getSiteName(siteId: number | null) {
    if (!siteId) return 'לא צוין'
    const site = sites.find(s => s.id === siteId)
    return site?.name || `אתר #${siteId}`
  }

  function getMaterialName(materialId: number | null) {
    if (!materialId) return 'לא צוין'
    const material = materials.find(m => m.id === materialId)
    return material?.name_hebrew || material?.name || `חומר #${materialId}`
  }

  function getTruckOrSubcontractor(job: Job) {
    // אם זו נסיעה של קבלן משנה, הצג את מספר המשאית (מזהה ראשי)
    if (job.is_subcontractor && job.subcontractor_id) {
      const subcontractor = subcontractors.find(s => s.id === job.subcontractor_id)
      // מספר משאית הוא המזהה העיקרי, שם הקבלן הוא משני
      const displayName = subcontractor?.truck_plate_number || subcontractor?.name || `קבלן #${job.subcontractor_id}`
      return {
        name: displayName,
        isSubcontractor: true
      }
    }
    // אחרת, הצג את המשאית
    if (!job.truck_id) {
      return { name: 'ללא משאית', isSubcontractor: false }
    }
    const truck = trucks.find(t => t.id === job.truck_id)
    return {
      name: truck?.plate_number || `משאית #${job.truck_id}`,
      isSubcontractor: false
    }
  }

  function getDriverName(driverId: number | null | undefined) {
    if (!driverId) return 'ללא נהג'
    const driver = drivers.find(d => d.id === driverId)
    return driver?.name || `נהג #${driverId}`
  }

  function getCustomerName(customerId: number | null | undefined) {
    if (!customerId) return 'לא צוין'
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || `לקוח #${customerId}`
  }

  async function handleStatusChange(jobId: number, newStatus: string) {
    try {
      await jobsApi.update(jobId, { status: newStatus as any })
      await loadData()
      setEditingJobId(null)
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('שגיאה בעדכון סטטוס')
    }
  }

  async function handleDownloadPDF(jobId: number) {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        alert('אנא התחבר מחדש למערכת')
        window.location.href = '/login'
        return
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001/api'}/jobs/${jobId}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) throw new Error('Failed to download PDF')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `delivery_note_${jobId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF download failed:', error)
      alert('שגיאה בהורדת PDF')
    }
  }

  async function handleShareWhatsApp(jobId: number) {
    const job = jobs.find(j => j.id === jobId)
    if (!job) return
    
    // Get token for authenticated PDF access
    const token = localStorage.getItem('access_token')
    if (!token) {
      alert('אנא התחבר מחדש למערכת')
      window.location.href = '/login'
      return
    }
    
    try {
      // Create share URL via API
      const response = await fetch(`/api/jobs/${jobId}/share`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to create share link')
      }
      
      const data = await response.json()
      const shareUrl = data.short_url
      
      const message = `🚛 *תעודת משלוח #${jobId}*

📄 צפה כאן: ${shareUrl}

_נשלח מ-TruckFlow_`
      
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      
    } catch (error) {
      console.error('Error creating share link:', error)
      alert('שגיאה ביצירת קישור שיתוף')
    }
  }

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const shiftDate = (dateStr: string, deltaDays: number) => {
    if (!dateStr) return ''
    const date = new Date(`${dateStr}T00:00:00`)
    date.setDate(date.getDate() + deltaDays)
    return formatDateInput(date)
  }

  const getMonthRange = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1)
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    return {
      from: formatDateInput(start),
      to: formatDateInput(end)
    }
  }

  const setMonthRange = (date: Date) => {
    const range = getMonthRange(date)
    setDateFrom(range.from)
    setDateTo(range.to)
  }

  const handleShiftDays = (deltaDays: number) => {
    if (dateFrom || dateTo) {
      setDateFrom(dateFrom ? shiftDate(dateFrom, deltaDays) : '')
      setDateTo(dateTo ? shiftDate(dateTo, deltaDays) : '')
      return
    }

    const today = formatDateInput(new Date())
    const shifted = shiftDate(today, deltaDays)
    setDateFrom(shifted)
    setDateTo(shifted)
  }

  const handleCalendarPrevMonth = () => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
    setCalendarMonth(next)
    setMonthRange(next)
  }

  const handleCalendarNextMonth = () => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
    setCalendarMonth(next)
    setMonthRange(next)
  }

  useEffect(() => {
    if (viewMode === 'calendar') {
      setMonthRange(calendarMonth)
    }
  }, [viewMode])

  // Filter jobs
  let filteredJobs = jobs.filter(job => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matches = job.id.toString().includes(searchLower) || job.status.toLowerCase().includes(searchLower)
      if (!matches) return false
    }
    if (dateFrom && job.scheduled_date && job.scheduled_date.split('T')[0] < dateFrom) return false
    if (dateTo && job.scheduled_date && job.scheduled_date.split('T')[0] > dateTo) return false
    return true
  })

  // Sort DESC (newest first)
  filteredJobs = filteredJobs.sort((a, b) => {
    const dateA = a.scheduled_date || ''
    const dateB = b.scheduled_date || ''
    return dateB.localeCompare(dateA)
  })

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const monthLabel = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(calendarMonth)
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate()
  const firstDayIndex = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay()
  const calendarCells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayIndex + 1
    if (dayNumber < 1 || dayNumber > daysInMonth) return null
    const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber)
    return formatDateInput(date)
  })

  const jobsByDate = jobs.reduce<Record<string, Job[]>>((acc, job) => {
    const dateKey = job.scheduled_date ? job.scheduled_date.split('T')[0] : ''
    if (!dateKey) return acc
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(job)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.jobs')}</h1>
            <p className="text-gray-600 mt-1">{t('jobs.subtitle')}</p>
          </div>
          <button
            onClick={() => window.location.href = '/jobs/new'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            {t('jobs.create')}
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                רשימה
              </button>
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
              >
                לוח שנה
              </button>
            </div>

            {viewMode === 'calendar' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCalendarPrevMonth}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                  {monthLabel}
                </div>
                <button
                  type="button"
                  onClick={handleCalendarNextMonth}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">{t('jobs.allStatuses')}</option>
                <option value="PLANNED">{t('jobs.status.PLANNED')}</option>
                <option value="ASSIGNED">{t('jobs.status.ASSIGNED')}</option>
                <option value="ENROUTE_PICKUP">{t('jobs.status.ENROUTE_PICKUP')}</option>
                <option value="LOADED">{t('jobs.status.LOADED')}</option>
                <option value="ENROUTE_DROPOFF">{t('jobs.status.ENROUTE_DROPOFF')}</option>
                <option value="DELIVERED">{t('jobs.status.DELIVERED')}</option>
                <option value="CLOSED">{t('jobs.status.CLOSED')}</option>
                <option value="CANCELED">{t('jobs.status.CANCELED')}</option>
              </select>
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                placeholder="מתאריך"
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
                placeholder="עד תאריך"
              />
            </div>
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => handleShiftDays(-1)}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
              יום אחורה
            </button>
            <button
              type="button"
              onClick={() => handleShiftDays(1)}
              className="inline-flex items-center gap-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              יום קדימה
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          
          {(searchTerm || statusFilter !== 'all' || dateFrom || dateTo) && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                  setDateFrom('')
                  setDateTo('')
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                נקה פילטרים
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : viewMode === 'calendar' ? (
            <div className="p-4">
              <div className="grid grid-cols-7 text-center text-xs font-medium text-gray-500 mb-2">
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
                  <div key={day} className="py-2">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-2">
                {calendarCells.map((dateKey, idx) => {
                  const dayJobs = dateKey ? (jobsByDate[dateKey] || []) : []
                  const dayNumber = dateKey ? parseInt(dateKey.split('-')[2], 10) : ''
                  return (
                    <div
                      key={`${dateKey || 'empty'}-${idx}`}
                      className={`min-h-[110px] border rounded-lg p-2 text-sm ${dateKey ? 'bg-white' : 'bg-gray-50'}`}
                    >
                      {dateKey && (
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-gray-700">{dayNumber}</span>
                          {dayJobs.length > 0 && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              {dayJobs.length}
                            </span>
                          )}
                        </div>
                      )}

                      {dateKey && dayJobs.slice(0, 3).map(job => (
                        <div key={job.id} className="text-xs text-gray-600 truncate">
                          #{job.id} • {getCustomerName(job.customer_id)}
                        </div>
                      ))}

                      {dateKey && dayJobs.length > 3 && (
                        <div className="text-xs text-gray-400 mt-1">
                          +{dayJobs.length - 3} נוספות
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : paginatedJobs.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t('jobs.noJobs')}</h3>
              <p className="text-gray-600 mb-4">{t('jobs.noJobsDesc')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('jobs.id')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('jobs.date')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">לקוח</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('jobs.route')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('jobs.material')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('jobs.quantity')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">🚛 משאית</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">👤 נהג</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('jobs.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => window.location.href = `/jobs/${job.id}`}>
                        <td className="px-6 py-4 text-sm font-medium">#{job.id}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            {formatDate(job.scheduled_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            {getCustomerName(job.customer_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>מ: {getSiteName(job.from_site_id)}</div>
                          <div>ל: {getSiteName(job.to_site_id)}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            {getMaterialName(job.material_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {job.actual_qty || job.planned_qty} {billingUnitLabels[job.unit] || t(`units.${job.unit}`)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {(() => {
                            const truckOrSub = getTruckOrSubcontractor(job)
                            return (
                              <div className={`flex items-center gap-2 font-semibold ${
                                truckOrSub.isSubcontractor ? 'text-purple-700' : 'text-orange-700'
                              }`}>
                                {truckOrSub.isSubcontractor ? (
                                  <span className="text-lg">👷</span>
                                ) : (
                                  <Truck className="w-4 h-4 text-orange-600" />
                                )}
                                {truckOrSub.name}
                              </div>
                            )
                          })()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3 h-3 text-gray-400" />
                            {getDriverName(job.driver_id)}
                          </div>
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          {editingJobId === job.id ? (
                            <select
                              value={job.status}
                              onChange={(e) => handleStatusChange(job.id, e.target.value)}
                              autoFocus
                              className="px-2 py-1 text-xs rounded-full border"
                            >
                              <option value="PLANNED">מתוכנן</option>
                              <option value="ASSIGNED">משובץ</option>
                              <option value="ENROUTE_PICKUP">בדרך לטעינה</option>
                              <option value="LOADED">נטען</option>
                              <option value="ENROUTE_DROPOFF">בדרך לפריקה</option>
                              <option value="DELIVERED">נמסר</option>
                              <option value="CLOSED">סגור</option>
                              <option value="CANCELED">מבוטל</option>
                            </select>
                          ) : (
                            <span 
                              className={`px-2 py-1 text-xs rounded-full cursor-pointer ${STATUS_COLORS[job.status]}`}
                              onClick={() => setEditingJobId(job.id)}
                            >
                              {t(`jobs.status.${job.status}`)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadPDF(job.id)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="הורד PDF"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleShareWhatsApp(job.id)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="שתף ב-WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => window.location.href = `/jobs/${job.id}/edit`} 
                              className="text-blue-600 text-xs hover:underline"
                            >
                              ערוך
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="px-6 py-4 border-t flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    מציג {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredJobs.length)} מתוך {filteredJobs.length}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded disabled:opacity-50">← הקודם</button>
                    {Array.from({length: Math.min(5, totalPages)}, (_, i) => {
                      const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                      if (page > totalPages) return null
                      return (
                        <button 
                          key={page} 
                          onClick={() => setCurrentPage(page)} 
                          className={`w-8 h-8 rounded ${currentPage === page ? 'bg-blue-600 text-white' : 'border'}`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">הבא →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {!loading && filteredJobs.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center gap-2 text-blue-900">
              <Truck className="w-5 h-5" />
              <span className="font-medium">{t('jobs.total')}: {filteredJobs.length}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
