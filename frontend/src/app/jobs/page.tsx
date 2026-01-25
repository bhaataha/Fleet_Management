'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { jobsApi, sitesApi, materialsApi, driversApi, customersApi } from '@/lib/api'
import { Truck, Calendar, User, Package, Plus, Search, Filter, Building2 } from 'lucide-react'
import type { Job, Site, Material, Driver, Customer } from '@/types'

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
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editingJobId, setEditingJobId] = useState<number | null>(null)

  const itemsPerPage = 20

  useEffect(() => {
    loadData()
  }, [statusFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, dateFrom, dateTo, statusFilter])

  async function loadData() {
    try {
      setLoading(true)
      const params: any = { limit: 200 }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      const [jobsRes, sitesRes, materialsRes, driversRes, customersRes] = await Promise.all([
        jobsApi.list(params),
        sitesApi.getAll(),
        materialsApi.getAll(),
        driversApi.getAll(),
        customersApi.getAll(),
      ])
      
      setJobs(jobsRes.data)
      setSites(sitesRes.data)
      setMaterials(materialsRes.data)
      setDrivers(driversRes.data)
      setCustomers(customersRes.data)
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
      await jobsApi.update(jobId, { status: newStatus })
      await loadData()
      setEditingJobId(null)
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('שגיאה בעדכון סטטוס')
    }
  }

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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('jobs.driver')}</th>
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
                            {new Date(job.scheduled_date).toLocaleDateString('he-IL')}
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
                          {job.actual_qty || job.planned_qty} {t(`units.${job.unit}`)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
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
                          <button onClick={() => window.location.href = `/jobs/${job.id}/edit`} className="text-blue-600">ערוך</button>
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
