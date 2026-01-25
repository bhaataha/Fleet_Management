'use client'

import { useEffect, useState, useRef } from 'react'
import { useI18n } from '@/lib/i18n'
import { jobsApi, driversApi, trucksApi, sitesApi, materialsApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar as CalendarIcon, Filter, Truck as TruckIcon, GripVertical, ChevronLeft, ChevronRight, MapPin, Eye } from 'lucide-react'
import type { Job, Driver, Truck, Site, Material } from '@/types'
import { formatDate, jobStatusLabels, jobStatusColors } from '@/lib/utils'
import Link from 'next/link'

// Compact Job Card Component for Grid View
interface CompactJobCardProps {
  job: Job
  onDragStart: (job: Job) => void
  onDragEnd: () => void
  isDragging: boolean
  getSiteName: (id: number | null) => string
  getMaterialName: (id: number | null) => string
}

function CompactJobCard({ job, onDragStart, onDragEnd, isDragging, getSiteName, getMaterialName }: CompactJobCardProps) {
  const statusColor = jobStatusColors[job.status as keyof typeof jobStatusColors] || 'gray'
  const statusLabel = jobStatusLabels[job.status as keyof typeof jobStatusLabels] || job.status

  return (
    <div
      draggable
      onDragStart={() => onDragStart(job)}
      onDragEnd={onDragEnd}
      className={`bg-white border rounded p-2 transition-all ${
        isDragging ? 'opacity-30 scale-95' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-gray-700">#{job.id}</span>
          <Link
            href={`/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-800"
            title="צפה בתעודה"
          >
            <Eye className="w-3 h-3" />
          </Link>
        </div>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium bg-${statusColor}-100 text-${statusColor}-800`}>
          {statusLabel}
        </span>
      </div>
      <div className="space-y-0.5 text-[10px] text-gray-600">
        <div className="font-medium truncate">{getMaterialName(job.material_id)}</div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{getSiteName(job.from_site_id)}</span>
        </div>
        <div className="text-xs text-blue-600 font-medium">
          {job.planned_qty} {job.unit}
        </div>
      </div>
    </div>
  )
}

export default function DispatchPage() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(today)
  const [loading, setLoading] = useState(true)
  const [draggedJob, setDraggedJob] = useState<Job | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'columns' | 'grid'>('columns')
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [selectedDate])

  // Convert vertical scroll to horizontal scroll
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      // Only intercept if scrolling vertically
      if (e.deltaY !== 0 && e.deltaX === 0) {
        e.preventDefault()
        container.scrollLeft += e.deltaY
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Auto-scroll when dragging near edges
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedJob || !scrollContainerRef.current) return

      const container = scrollContainerRef.current
      const rect = container.getBoundingClientRect()
      const edgeThreshold = 100 // pixels from edge to trigger scroll
      const scrollSpeed = 10

      // Clear existing interval
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
        autoScrollIntervalRef.current = null
      }

      // Scroll left when near left edge
      if (e.clientX < rect.left + edgeThreshold) {
        autoScrollIntervalRef.current = setInterval(() => {
          container.scrollLeft -= scrollSpeed
        }, 20)
      }
      // Scroll right when near right edge
      else if (e.clientX > rect.right - edgeThreshold) {
        autoScrollIntervalRef.current = setInterval(() => {
          container.scrollLeft += scrollSpeed
        }, 20)
      }
    }

    if (draggedJob) {
      document.addEventListener('mousemove', handleMouseMove)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current)
      }
    }
  }, [draggedJob])

  const loadData = async () => {
    setLoading(true)
    try {
      const [jobsRes, driversRes, trucksRes, sitesRes, materialsRes] = await Promise.all([
        jobsApi.getAll(),
        driversApi.getAll(),
        trucksApi.getAll(),
        sitesApi.getAll(),
        materialsApi.getAll(),
      ])
      
      // Filter jobs by selected date on client side
      const filteredJobs = jobsRes.data.filter((job: Job) => {
        if (!job.scheduled_date) return false
        const jobDate = job.scheduled_date.split('T')[0]
        return jobDate === selectedDate
      })
      
      setJobs(filteredJobs)
      setDrivers(driversRes.data.filter((d: Driver) => d.is_active))
      setTrucks(trucksRes.data.filter((t: Truck) => t.is_active))
      setSites(sitesRes.data)
      setMaterials(materialsRes.data)
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

  // Separate closed jobs from active jobs
  const closedStatuses = ['DELIVERED', 'CLOSED', 'CANCELED']
  const activeJobs = jobs.filter(j => !closedStatuses.includes(j.status))
  const closedJobs = jobs.filter(j => closedStatuses.includes(j.status))

  const groupedJobs = {
    unassigned: activeJobs.filter(j => !j.driver_id),
    byDriver: drivers.map(driver => ({
      driver,
      jobs: activeJobs.filter(j => j.driver_id === driver.id)
    })),
    closed: closedJobs
  }

  const handleDragStart = (job: Job) => {
    setDraggedJob(job)
  }

  const handleDragEnd = () => {
    setDraggedJob(null)
  }

  const handleDrop = async (driverId: number | null) => {
    if (!draggedJob) return
    
    try {
      // When dropping to unassigned (driverId is null), only clear driver and truck - keep existing status
      if (driverId === null) {
        await jobsApi.update(draggedJob.id, { 
          driver_id: null,
          truck_id: null
        })
      } else {
        // When assigning to a driver, set status to ASSIGNED
        await jobsApi.update(draggedJob.id, { 
          driver_id: driverId,
          status: 'ASSIGNED'
        })
      }
      await loadData()
    } catch (error) {
      console.error('Failed to assign driver:', error)
      alert('שגיאה בשיבוץ נהג')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' })
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
          
          {/* Date Selector & View Mode Toggle */}
          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-white rounded-lg shadow hover:bg-gray-50 transition-colors flex items-center gap-2"
              title="רענן נתונים"
            >
              🔄 רענן
            </button>
            
            {/* View Mode Toggle */}
            <div className="bg-white rounded-lg shadow p-1 flex gap-1">
              <button
                onClick={() => setViewMode('columns')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'columns'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="תצוגת עמודות"
              >
                📋 עמודות
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="תצוגת רשת קומפקטית"
              >
                📊 רשת
              </button>
            </div>

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
        ) : viewMode === 'grid' ? (
          /* Grid View - Compact */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Unassigned Box */}
            <div
              className={`bg-gray-50 rounded-lg p-3 min-h-[200px] border-2 transition-all ${
                draggedJob ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(null)}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-300">
                <Filter className="w-4 h-4 text-gray-600" />
                <h3 className="font-semibold text-sm text-gray-900">
                  לא משובץ ({groupedJobs.unassigned.length})
                </h3>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {groupedJobs.unassigned.map(job => (
                  <CompactJobCard
                    key={job.id}
                    job={job}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedJob?.id === job.id}
                    getSiteName={getSiteName}
                    getMaterialName={getMaterialName}
                  />
                ))}
              </div>
            </div>

            {/* Driver Boxes */}
            {groupedJobs.byDriver.map(({ driver, jobs: driverJobs }) => (
              <div
                key={driver.id}
                className={`bg-white rounded-lg p-3 min-h-[200px] border-2 transition-all shadow-sm ${
                  draggedJob && draggedJob.driver_id !== driver.id
                    ? 'border-green-400'
                    : 'border-gray-200'
                }`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(driver.id)}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-700 font-semibold text-sm">
                      {driver.name.charAt(0)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm text-gray-900 truncate">
                      {driver.name}
                    </h3>
                    <p className="text-xs text-gray-500">{driverJobs.length} נסיעות</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {driverJobs.map(job => (
                    <CompactJobCard
                      key={job.id}
                      job={job}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedJob?.id === job.id}
                      getSiteName={getSiteName}
                      getMaterialName={getMaterialName}
                    />
                  ))}
                  {driverJobs.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-3">אין נסיעות</p>
                  )}
                </div>
              </div>
            ))}

            {/* Closed Jobs Box */}
            <div className="bg-gray-100 rounded-lg p-3 min-h-[200px] border-2 border-gray-300">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-400">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 font-semibold text-lg">✓</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-gray-900">
                    נסיעות סגורות
                  </h3>
                  <p className="text-xs text-gray-600">{groupedJobs.closed.length} נסיעות</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {groupedJobs.closed.map(job => (
                  <CompactJobCard
                    key={job.id}
                    job={job}
                    onDragStart={() => {}} 
                    onDragEnd={() => {}}
                    isDragging={false}
                    getSiteName={getSiteName}
                    getMaterialName={getMaterialName}
                  />
                ))}
                {groupedJobs.closed.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">אין נסיעות סגורות</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Column View - Original */
          <div className="relative">
            {/* Scroll Navigation Buttons */}
            <button
              onClick={scrollRight}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"
              title="גלול שמאלה לעוד נהגים"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={scrollLeft}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"
              title="גלול ימינה"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Scroll Indicator */}
            <div className="absolute top-0 right-0 bg-gradient-to-l from-gray-100 to-transparent w-20 h-full pointer-events-none z-5" />
            <div className="absolute top-0 left-0 bg-gradient-to-r from-gray-100 to-transparent w-20 h-full pointer-events-none z-5" />

            <div 
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto pb-4 scroll-smooth"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#3B82F6 #E5E7EB'
              }}
            >
            {/* Unassigned Jobs Column */}
            <div 
              className={`
                bg-gray-50 rounded-lg p-4 min-w-[280px] w-[280px] flex-shrink-0
                transition-all duration-200
                ${draggedJob ? 'ring-2 ring-blue-400 ring-offset-2 bg-blue-50' : ''}
              `}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(null)}
            >
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t('dispatch.unassigned')} ({groupedJobs.unassigned.length})
              </h3>
              <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {draggedJob && (
                  <div className="text-xs text-blue-600 bg-blue-100 rounded p-2 mb-2 text-center">
                    ↓ גרור לכאן כדי לבטל שיבוץ ↓
                  </div>
                )}
                {groupedJobs.unassigned.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job} 
                    getSiteName={getSiteName}
                    getMaterialName={getMaterialName}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedJob?.id === job.id}
                  />
                ))}
                {groupedJobs.unassigned.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    כל הנסיעות משובצות
                  </p>
                )}
              </div>
            </div>

            {/* Driver Columns - All drivers */}
            {groupedJobs.byDriver.map(({ driver, jobs: driverJobs }) => (
              <div 
                key={driver.id} 
                className={`
                  bg-white rounded-lg shadow p-4 min-w-[280px] w-[280px] flex-shrink-0
                  transition-all duration-200
                  ${draggedJob && draggedJob.driver_id !== driver.id ? 'ring-2 ring-green-400 ring-offset-2' : ''}
                `}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(driver.id)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-semibold text-lg">
                      {driver.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{driver.name}</h3>
                    <p className="text-xs text-gray-500">{driverJobs.length} נסיעות</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                  {driverJobs.map(job => (
                    <JobCard 
                      key={job.id} 
                      job={job}
                      getSiteName={getSiteName}
                      getMaterialName={getMaterialName}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedJob?.id === job.id}
                    />
                  ))}
                  {driverJobs.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">
                      אין נסיעות
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Closed Jobs Column */}
            <div className="bg-gray-100 rounded-lg shadow p-4 min-w-[280px] w-[280px] flex-shrink-0 border-2 border-gray-300">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-400">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-700 font-semibold text-2xl">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900">נסיעות סגורות</h3>
                  <p className="text-xs text-gray-600">{groupedJobs.closed.length} נסיעות</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {groupedJobs.closed.map(job => (
                  <JobCard 
                    key={job.id} 
                    job={job}
                    getSiteName={getSiteName}
                    getMaterialName={getMaterialName}
                    onDragStart={() => {}}
                    onDragEnd={() => {}}
                    isDragging={false}
                  />
                ))}
                {groupedJobs.closed.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    אין נסיעות סגורות
                  </p>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function JobCard({ job, getSiteName, getMaterialName, onDragStart, onDragEnd, isDragging }: { 
  job: Job
  getSiteName: (id: number | null) => string
  getMaterialName: (id: number | null) => string
  onDragStart?: (job: Job) => void
  onDragEnd?: () => void
  isDragging?: boolean
}) {
  const { t } = useI18n()
  const scheduledDate = job.scheduled_date ? new Date(job.scheduled_date) : null
  
  return (
    <div 
      draggable
      onDragStart={() => onDragStart?.(job)}
      onDragEnd={onDragEnd}
      className={`
        bg-white border border-gray-200 rounded-lg p-3 
        hover:shadow-md transition-all cursor-move
        ${isDragging ? 'opacity-50 scale-95' : 'hover:scale-102'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-900">#{job.id}</span>
          <Link
            href={`/jobs/${job.id}`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-800"
            title="צפה בתעודה"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
        </div>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${jobStatusColors[job.status]}`}>
          {t(`jobStatus.${job.status}`)}
        </span>
      </div>
      
      {scheduledDate && (
        <div className="text-xs text-blue-600 font-medium mb-2">
          📅 {scheduledDate.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'short' })}
        </div>
      )}
      
      <div className="space-y-1 text-xs text-gray-600">
        <div className="font-medium">{getMaterialName(job.material_id)}</div>
        <div>מ: {getSiteName(job.from_site_id)}</div>
        <div>ל: {getSiteName(job.to_site_id)}</div>
        <div className="font-semibold text-blue-600">
          {job.planned_qty} {t(`billingUnit.${job.unit}`)}
        </div>
      </div>
    </div>
  )
}
