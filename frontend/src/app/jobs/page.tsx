'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { jobsApi, sitesApi, materialsApi, driversApi, customersApi } from '@/lib/api'
import { Truck, MapPin, Calendar, User, Package, Plus, Search, Filter, Building2 } from 'lucide-react'
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
  const [editingJobId, setEditingJobId] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [statusFilter])

  const loadData = async () => {
    try {
      setLoading(true)
      const params: any = {}
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

  const getSiteName = (siteId: number | null) => {
    if (!siteId) return 'לא צוין'
    const site = sites.find(s => s.id === siteId)
    return site?.name || `אתר #${siteId}`
  }

  const getMaterialName = (materialId: number | null) => {
    if (!materialId) return 'לא צוין'
    const material = materials.find(m => m.id === materialId)
    return material?.name_hebrew || material?.name || `חומר #${materialId}`
  }

  const getDriverName = (driverId: number | null | undefined) => {
    if (!driverId) return 'ללא נהג'
    const driver = drivers.find(d => d.id === driverId)
    return driver?.name || `נהג #${driverId}`
  }

  const getCustomerName = (customerId: number | null | undefined) => {
    if (!customerId) return 'לא צוין'
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || `לקוח #${customerId}`
  }

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      await jobsApi.update(jobId, { status: newStatus })
      await loadData()
      setEditingJobId(null)
    } catch (error) {
      console.error('Failed to update status:', error)
      alert('שגיאה בעדכון סטטוס')
    }
  }

  const filteredJobs = jobs.filter(job => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        job.id.toString().includes(searchLower) ||
        job.status.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('nav.jobs')}</h1>
            <p className="text-gray-600 mt-1">{t('jobs.subtitle')}</p>
          </div>
          <button
            onClick={() => window.location.href = '/jobs/new'}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('jobs.create')}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('common.search')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('jobs.noJobs')}
              </h3>
              <p className="text-gray-600 mb-4">{t('jobs.noJobsDesc')}</p>
              <button
                onClick={() => window.location.href = '/jobs/new'}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                {t('jobs.createFirst')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('jobs.id')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('jobs.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      לקוח
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('jobs.route')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('jobs.material')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('jobs.quantity')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('jobs.driver')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('jobs.status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr 
                      key={job.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/jobs/${job.id}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{job.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          {new Date(job.scheduled_date).toLocaleDateString('he-IL')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{getCustomerName(job.customer_id)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">מ:</span>
                            <span className="font-medium">{getSiteName(job.from_site_id)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">ל:</span>
                            <span className="font-medium">{getSiteName(job.to_site_id)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-gray-400" />
                          {getMaterialName(job.material_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {job.actual_qty || job.planned_qty} {t(`units.${job.unit}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          {getDriverName(job.driver_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingJobId === job.id ? (
                          <select
                            value={job.status}
                            onChange={(e) => handleStatusChange(job.id, e.target.value)}
                            onBlur={() => setEditingJobId(null)}
                            autoFocus
                            className="px-2 py-1 text-xs font-medium rounded-full border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 ${STATUS_COLORS[job.status]}`}
                            onClick={() => setEditingJobId(job.id)}
                            title="לחץ לעריכה"
                          >
                            {t(`jobs.status.${job.status}`)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => window.location.href = `/jobs/${job.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
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
          )}
        </div>

        {/* Summary */}
        {!loading && filteredJobs.length > 0 && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
            <div className="flex items-center gap-2 text-blue-900">
              <Truck className="w-5 h-5" />
              <span className="font-medium">
                {t('jobs.total')}: {filteredJobs.length} {t('jobs.jobs')}
              </span>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
