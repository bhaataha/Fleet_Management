'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { jobsApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import type { Job } from '@/types'
import { formatDate, jobStatusLabels, jobStatusColors } from '@/lib/utils'

export default function DashboardPage() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTodayJobs()
  }, [])

  const loadTodayJobs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await jobsApi.list({ date: today })
      setJobs(response.data)
    } catch (error) {
      console.error('Failed to load jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    total: jobs.length,
    planned: jobs.filter(j => j.status === 'PLANNED').length,
    active: jobs.filter(j => ['ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF'].includes(j.status)).length,
    completed: jobs.filter(j => j.status === 'DELIVERED' || j.status === 'CLOSED').length,
    canceled: jobs.filter(j => j.status === 'CANCELED').length,
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.title')}</h1>
          <p className="text-gray-600 mt-2">{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.todayJobs')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Active Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.activeJobs')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Completed Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('dashboard.completedToday')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Planned Jobs */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">{t('jobStatus.PLANNED')}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.planned}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Today's Jobs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {t('dashboard.todayJobs')}
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500">{t('common.loading')}</div>
            ) : jobs.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                אין נסיעות מתוכננות להיום
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.jobNumber')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.fromSite')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.toSite')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.material')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('jobs.driver')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      {t('common.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">#{job.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{job.from_site_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{job.to_site_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{job.material_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {job.driver_id || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${jobStatusColors[job.status]}`}>
                          {t(`jobStatus.${job.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
