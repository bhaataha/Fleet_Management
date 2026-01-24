'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { jobsApi, driversApi, trucksApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar as CalendarIcon, Filter, Truck as TruckIcon } from 'lucide-react'
import type { Job, Driver, Truck } from '@/types'
import { formatDate, jobStatusLabels, jobStatusColors } from '@/lib/utils'

export default function DispatchPage() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = async () => {
    setLoading(true)
    try {
      const [jobsRes, driversRes, trucksRes] = await Promise.all([
        jobsApi.list({ date: selectedDate }),
        driversApi.list({ is_active: true }),
        trucksApi.list({ is_active: true }),
      ])
      setJobs(jobsRes.data)
      setDrivers(driversRes.data)
      setTrucks(trucksRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedJobs = {
    unassigned: jobs.filter(j => !j.driver_id),
    byDriver: drivers.map(driver => ({
      driver,
      jobs: jobs.filter(j => j.driver_id === driver.id)
    }))
  }

  const handleAssignDriver = async (jobId: number, driverId: number, truckId: number) => {
    try {
      await jobsApi.update(jobId, { driver_id: driverId, truck_id: truckId })
      await loadData()
    } catch (error) {
      console.error('Failed to assign driver:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dispatch.title')}</h1>
            <p className="text-gray-600 mt-1">שיבוץ נהגים ורכבים לנסיעות</p>
          </div>
          
          {/* Date Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow">
              <CalendarIcon className="w-5 h-5 text-gray-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none focus:ring-0 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Unassigned Jobs Column */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t('dispatch.unassigned')} ({groupedJobs.unassigned.length})
              </h3>
              <div className="space-y-3">
                {groupedJobs.unassigned.map(job => (
                  <JobCard key={job.id} job={job} />
                ))}
                {groupedJobs.unassigned.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    כל הנסיעות משובצות
                  </p>
                )}
              </div>
            </div>

            {/* Driver Columns */}
            {groupedJobs.byDriver.slice(0, 3).map(({ driver, jobs: driverJobs }) => (
              <div key={driver.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold">
                      {driver.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{driver.name}</h3>
                    <p className="text-xs text-gray-500">{driverJobs.length} נסיעות</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {driverJobs.map(job => (
                    <JobCard key={job.id} job={job} />
                  ))}
                  {driverJobs.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      אין נסיעות
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function JobCard({ job }: { job: Job }) {
  const { t } = useI18n()
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-move">
      <div className="flex items-start justify-between mb-2">
        <span className="text-sm font-semibold text-gray-900">#{job.id}</span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${jobStatusColors[job.status]}`}>
          {t(`jobStatus.${job.status}`)}
        </span>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div>מ: {job.from_site_id}</div>
        <div>ל: {job.to_site_id}</div>
        <div>{job.planned_qty} {t(`billingUnit.${job.unit}`)}</div>
      </div>
    </div>
  )
}
