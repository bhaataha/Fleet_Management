'use client'

import { useEffect, useState, useRef } from 'react'
import { useI18n } from '@/lib/i18n'
import { jobsApi, driversApi, trucksApi, sitesApi, materialsApi, subcontractorsApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Calendar as CalendarIcon, Filter, Truck as TruckIcon, GripVertical, ChevronLeft, ChevronRight, MapPin, Eye, UserCheck } from 'lucide-react'
import type { Job, Driver, Truck, Site, Material } from '@/types'
import { formatDate, jobStatusLabels, jobStatusColors, billingUnitLabels } from '@/lib/utils'
import Link from 'next/link'

// Compact Job Card Component for Grid View
interface CompactJobCardProps {
  job: Job
  onDragStart: (job: Job) => void
  onDragEnd: () => void
  isDragging: boolean
  getSiteName: (id: number | null) => string
  getMaterialName: (id: number | null) => string
  getSubcontractorName?: (id: number | null) => string
  showAssignActions?: boolean
  onAssignTruck?: (job: Job) => void
  onAssignSubcontractor?: (job: Job) => void
}

function CompactJobCard({ job, onDragStart, onDragEnd, isDragging, getSiteName, getMaterialName, getSubcontractorName, showAssignActions, onAssignTruck, onAssignSubcontractor }: CompactJobCardProps) {
  const statusColor = jobStatusColors[job.status as keyof typeof jobStatusColors] || 'gray'
  const statusLabel = jobStatusLabels[job.status as keyof typeof jobStatusLabels] || job.status

  return (
    <div
      draggable
      onDragStart={() => onDragStart(job)}
      onDragEnd={onDragEnd}
      className={`bg-white border rounded p-2 transition-all ${
        isDragging ? 'opacity-30 scale-95' : 'hover:shadow-md'
      } ${job.is_subcontractor ? 'border-l-4 border-l-purple-400' : ''}`}
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
      {job.is_subcontractor && job.subcontractor_id && getSubcontractorName && (
        <div className="mb-1 px-1.5 py-0.5 bg-purple-50 rounded text-[10px] font-medium text-purple-700 flex items-center gap-1">
          👷 {getSubcontractorName(job.subcontractor_id)}
        </div>
      )}
      <div className="space-y-0.5 text-[10px] text-gray-600">
        <div className="font-medium truncate">{getMaterialName(job.material_id)}</div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{getSiteName(job.from_site_id)}</span>
        </div>
        <div className="text-xs text-blue-600 font-medium">
          {job.planned_qty} {billingUnitLabels[job.unit] || job.unit}
        </div>
      </div>
      {showAssignActions && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onAssignTruck?.(job)
            }}
            className="flex-1 text-[10px] bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-1 hover:bg-orange-100"
          >
            שיבוץ משאית
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onAssignSubcontractor?.(job)
            }}
            className="flex-1 text-[10px] bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1 hover:bg-purple-100"
          >
            קבלן משנה
          </button>
        </div>
      )}
    </div>
  )
}

export default function DispatchPage() {
  const { t } = useI18n()
  const [jobs, setJobs] = useState<Job[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [trucks, setTrucks] = useState<Truck[]>([])
  const [subcontractors, setSubcontractors] = useState<any[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const now = new Date()
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const [selectedDate, setSelectedDate] = useState(today)
  const [loading, setLoading] = useState(true)
  const [draggedJob, setDraggedJob] = useState<Job | null>(null)
  const [showSubcontractorModal, setShowSubcontractorModal] = useState(false)
  const [selectedSubcontractorId, setSelectedSubcontractorId] = useState<number | null>(null)
  const [pendingJobForSubcontractor, setPendingJobForSubcontractor] = useState<Job | null>(null)
  const [showTruckAssignModal, setShowTruckAssignModal] = useState(false)
  const [pendingJobForTruck, setPendingJobForTruck] = useState<Job | null>(null)
  const [selectedTruckId, setSelectedTruckId] = useState<number | null>(null)
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<'columns' | 'grid' | 'subcontractors'>('columns')
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    loadData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData()
    }, 30000)
    
    // רענון אוטומטי כשהדף נטען (אחרי עריכה/יצירה)
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
      clearInterval(interval)
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
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
      // חישוב טווח תאריכים: ±10 ימים מהתאריך הנבחר
      const selected = new Date(selectedDate)
      const fromDate = new Date(selected)
      fromDate.setDate(selected.getDate() - 10)
      const toDate = new Date(selected)
      toDate.setDate(selected.getDate() + 10)
      
      const [jobsRes, driversRes, trucksRes, subcontractorsRes, sitesRes, materialsRes] = await Promise.all([
        jobsApi.getAll({
          limit: 1000,
          from_date: fromDate.toISOString().split('T')[0],
          to_date: toDate.toISOString().split('T')[0]
        }),
        driversApi.getAll(),
        trucksApi.getAll(),
        subcontractorsApi.getAll(),
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
      setSubcontractors(subcontractorsRes.data.filter((s: any) => s.is_active))
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

  const getSubcontractorName = (subcontractorId: number | null) => {
    if (!subcontractorId) return 'לא צוין'
    const subcontractor = subcontractors.find(s => s.id === subcontractorId)
    // מספר משאית הוא המזהה העיקרי, שם הקבלן הוא משני
    return subcontractor?.truck_plate_number || subcontractor?.name || `קבלן #${subcontractorId}`
  }

  // Separate closed jobs from active jobs
  const closedStatuses = ['DELIVERED', 'CLOSED', 'CANCELED']
  const activeJobs = jobs.filter(j => !closedStatuses.includes(j.status))
  const closedJobs = jobs.filter(j => closedStatuses.includes(j.status))

  const groupedJobs = {
    unassigned: activeJobs.filter(j => !j.truck_id && !j.subcontractor_id),
    byTruck: trucks.map(truck => ({
      truck,
      jobs: activeJobs.filter(j => j.truck_id === truck.id && !j.subcontractor_id)
    })),
    // All subcontractor jobs grouped into ONE column (for grid/column view)
    allSubcontractorJobs: activeJobs.filter(j => j.is_subcontractor && j.subcontractor_id),
    // Individual subcontractor columns (for subcontractors view)
    bySubcontractor: subcontractors.map(subcontractor => ({
      subcontractor,
      jobs: activeJobs.filter(j => j.subcontractor_id === subcontractor.id)
    })),
    closed: closedJobs
  }

  const handleDragStart = (job: Job) => {
    setDraggedJob(job)
  }

  const handleDragEnd = () => {
    setDraggedJob(null)
  }

  const handleSubcontractorSelect = async () => {
    if (!pendingJobForSubcontractor || !selectedSubcontractorId) return
    
    try {
      await jobsApi.update(pendingJobForSubcontractor.id, { 
        subcontractor_id: selectedSubcontractorId,
        is_subcontractor: true,
        subcontractor_billing_unit: pendingJobForSubcontractor.subcontractor_billing_unit || null,
        truck_id: null,
        driver_id: null,
        status: 'ASSIGNED'
      })
      setShowSubcontractorModal(false)
      setSelectedSubcontractorId(null)
      setPendingJobForSubcontractor(null)
      setDraggedJob(null)
      await loadData()
    } catch (error) {
      console.error('Error assigning subcontractor:', error)
      alert('שגיאה בשיבוץ קבלן משנה')
    }
  }

  const openSubcontractorAssign = (job: Job) => {
    setPendingJobForSubcontractor(job)
    setSelectedSubcontractorId(null)
    setShowSubcontractorModal(true)
  }

  const openTruckAssignModal = (job: Job) => {
    setPendingJobForTruck(job)
    setSelectedTruckId(null)
    setSelectedDriverId(null)
    setShowTruckAssignModal(true)
  }

  const handleTruckAssign = async () => {
    if (!pendingJobForTruck || !selectedTruckId) return

    try {
      await jobsApi.update(pendingJobForTruck.id, {
        truck_id: selectedTruckId,
        driver_id: selectedDriverId || null,
        subcontractor_id: null,
        is_subcontractor: false,
        status: 'ASSIGNED'
      })
      setShowTruckAssignModal(false)
      setPendingJobForTruck(null)
      setSelectedTruckId(null)
      setSelectedDriverId(null)
      await loadData()
    } catch (error) {
      console.error('Error assigning truck:', error)
      alert('שגיאה בשיבוץ משאית')
    }
  }

  const handleDrop = async (truckId: number | null, subcontractorId?: number | null) => {
    if (!draggedJob) return
    
    try {
      // Special case: dropping to unified subcontractors column (subcontractorId = -1)
      if (subcontractorId === -1) {
        // Save the job and open modal to select specific subcontractor
        setPendingJobForSubcontractor(draggedJob)
        setShowSubcontractorModal(true)
        return
      }
      
      // When dropping to unassigned (both null), clear everything
      if (truckId === null && !subcontractorId) {
        await jobsApi.update(draggedJob.id, { 
          truck_id: null,
          driver_id: null,
          subcontractor_id: null,
          is_subcontractor: false
        })
      } else if (subcontractorId) {
        // When assigning to subcontractor (old code path - shouldn't happen now but kept for compatibility)
        await jobsApi.update(draggedJob.id, { 
          subcontractor_id: subcontractorId,
          is_subcontractor: true,
          truck_id: null,
          driver_id: null,
          status: 'ASSIGNED'
        })
      } else {
        // When assigning to a truck
        await jobsApi.update(draggedJob.id, { 
          truck_id: truckId,
          subcontractor_id: null,
          is_subcontractor: false,
          status: 'ASSIGNED'
        })
      }
      await loadData()
    } catch (error) {
      console.error('Failed to assign:', error)
      alert('שגיאה בשיבוץ')
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
      {/* Subcontractor Selection Modal */}
      {showSubcontractorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSubcontractorModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">בחר קבלן משנה</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                קבלן משנה
              </label>
              <select
                value={selectedSubcontractorId || ''}
                onChange={(e) => setSelectedSubcontractorId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              >
                <option value="">-- בחר קבלן --</option>
                {subcontractors.map(sub => (
                  <option key={sub.id} value={sub.id}>
                    🚛 {sub.truck_plate_number || sub.name || `קבלן #${sub.id}`}
                    {sub.name && sub.truck_plate_number && ` (${sub.name})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סוג חיוב
              </label>
              <select
                value={pendingJobForSubcontractor?.subcontractor_billing_unit || ''}
                onChange={(e) => {
                  if (pendingJobForSubcontractor) {
                    setPendingJobForSubcontractor({
                      ...pendingJobForSubcontractor,
                      subcontractor_billing_unit: e.target.value
                    })
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">-- ברירת מחדל (לפי יחידת הנסיעה) --</option>
                <option value="TRIP">💰 נסיעה קבועה (TRIP)</option>
                <option value="TON">⚖️ לפי טון (TON)</option>
                <option value="M3">📦 לפי קוב (M3)</option>
                <option value="KM">📏 לפי ק"מ (KM)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {pendingJobForSubcontractor?.subcontractor_billing_unit === 'TRIP' && '• מחיר קבוע לנסיעה (לא משנה כמות)'}
                {pendingJobForSubcontractor?.subcontractor_billing_unit === 'TON' && '• מחיר יחושב לפי כמות הטונות'}
                {pendingJobForSubcontractor?.subcontractor_billing_unit === 'M3' && '• מחיר יחושב לפי כמות הקובים'}
                {pendingJobForSubcontractor?.subcontractor_billing_unit === 'KM' && '• מחיר יחושב לפי מרחק בק"מ'}
                {!pendingJobForSubcontractor?.subcontractor_billing_unit && '• יחושב אוטומטית לפי יחידת הנסיעה'}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubcontractorSelect}
                disabled={!selectedSubcontractorId}
                className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ✓ אשר
              </button>
              <button
                onClick={() => {
                  setShowSubcontractorModal(false)
                  setSelectedSubcontractorId(null)
                  setPendingJobForSubcontractor(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                ✕ ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Truck Assignment Modal */}
      {showTruckAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowTruckAssignModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-gray-900 mb-4">שיבוץ משאית</h3>

            {pendingJobForTruck && (
              <div className="mb-4 text-sm text-gray-600">
                נסיעה #{pendingJobForTruck.id} • {getMaterialName(pendingJobForTruck.material_id)}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">משאית</label>
              <select
                value={selectedTruckId || ''}
                onChange={(e) => setSelectedTruckId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">-- בחר משאית --</option>
                {trucks.map(truck => (
                  <option key={truck.id} value={truck.id}>
                    🚛 {truck.plate_number}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">נהג (אופציונלי)</label>
              <select
                value={selectedDriverId || ''}
                onChange={(e) => setSelectedDriverId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">-- ללא נהג --</option>
                {drivers.map(driver => (
                  <option key={driver.id} value={driver.id}>
                    👤 {driver.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTruckAssign}
                disabled={!selectedTruckId}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                ✓ אשר
              </button>
              <button
                onClick={() => {
                  setShowTruckAssignModal(false)
                  setPendingJobForTruck(null)
                  setSelectedTruckId(null)
                  setSelectedDriverId(null)
                }}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dispatch.title')}</h1>
            <p className="text-gray-600 mt-1">שיבוץ משאיות, נהגים וקבלני משנה לנסיעות</p>
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
              <button
                onClick={() => setViewMode('subcontractors')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'subcontractors'
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title="תצוגת עמודות קבלנים"
              >
                👷 קבלנים
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
                    showAssignActions
                    onAssignTruck={openTruckAssignModal}
                    onAssignSubcontractor={openSubcontractorAssign}
                  />
                ))}
              </div>
            </div>

            {/* All Subcontractors in ONE Box - Scalable Solution! */}
            <div
              className={`bg-white rounded-lg p-3 min-h-[200px] border-2 transition-all shadow-sm ${
                draggedJob && !draggedJob.is_subcontractor
                  ? 'border-purple-400'
                  : 'border-gray-200'
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(null, -1)}
            >
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    👷
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-purple-900">
                    קבלני משנה (כל הקבלנים)
                  </h3>
                  <p className="text-xs text-gray-500">{groupedJobs.allSubcontractorJobs.length} נסיעות</p>
                </div>
              </div>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {groupedJobs.allSubcontractorJobs.map(job => (
                  <CompactJobCard
                    key={job.id}
                    job={job}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedJob?.id === job.id}
                    getSiteName={getSiteName}
                    getMaterialName={getMaterialName}
                    getSubcontractorName={getSubcontractorName}
                  />
                ))}
                {groupedJobs.allSubcontractorJobs.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">אין נסיעות לקבלני משנה</p>
                )}
              </div>
            </div>

            {/* Truck Boxes */}
            {groupedJobs.byTruck.map(({ truck, jobs: truckJobs }) => (
              <div
                key={truck.id}
                className={`bg-white rounded-lg p-3 min-h-[200px] border-2 transition-all shadow-sm ${
                  draggedJob && draggedJob.truck_id !== truck.id
                    ? 'border-orange-400'
                    : 'border-gray-200'
                }`}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(truck.id)}
              >
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">
                      🚛
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Truck Number - Primary */}
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {truck.plate_number}
                    </h3>
                    {/* Driver Name - Secondary (if assigned) */}
                    {(() => {
                      const jobWithDriver = truckJobs.find(j => j.driver_id)
                      if (jobWithDriver?.driver_id) {
                        const driver = drivers.find(d => d.id === jobWithDriver.driver_id)
                        return driver ? (
                          <p className="text-xs text-orange-600 font-medium truncate">{driver.name}</p>
                        ) : null
                      }
                      return null
                    })()}
                    <p className="text-xs text-gray-500">{truckJobs.length} נסיעות</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {truckJobs.map(job => (
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
                  {truckJobs.length === 0 && (
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
                    getSubcontractorName={getSubcontractorName}
                  />
                ))}
                {groupedJobs.closed.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-3">אין נסיעות סגורות</p>
                )}
              </div>
            </div>
          </div>
        ) : viewMode === 'columns' ? (
          /* Column View - Trucks */
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
                    showAssignActions
                    onAssignTruck={openTruckAssignModal}
                    onAssignSubcontractor={openSubcontractorAssign}
                  />
                ))}
                {groupedJobs.unassigned.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    כל הנסיעות משובצות
                  </p>
                )}
              </div>
            </div>

            {/* All Subcontractors Column - ONE column instead of 1000! */}
            <div 
              className={`
                bg-white rounded-lg shadow p-4 min-w-[280px] w-[280px] flex-shrink-0
                transition-all duration-200
                ${draggedJob && !draggedJob.is_subcontractor ? 'ring-2 ring-purple-400 ring-offset-2' : ''}
              `}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(null, -1)}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    👷
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-purple-900 text-base">קבלני משנה</h3>
                  <p className="text-xs text-purple-600">{groupedJobs.allSubcontractorJobs.length} נסיעות</p>
                </div>
              </div>
              <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                {groupedJobs.allSubcontractorJobs.map(job => (
                  <div key={job.id} className="relative">
                    {/* Show truck number (primary) + name (secondary if exists) */}
                    {job.subcontractor_id && (
                      <div className="mb-1 px-2 py-1 bg-purple-50 rounded">
                        <div className="text-sm font-bold text-purple-900">
                          🚛 {(() => {
                            const sub = subcontractors.find(s => s.id === job.subcontractor_id)
                            return sub?.truck_plate_number || `קבלן #${job.subcontractor_id}`
                          })()}
                        </div>
                        {(() => {
                          const sub = subcontractors.find(s => s.id === job.subcontractor_id)
                          return sub?.name ? (
                            <div className="text-xs text-purple-600">{sub.name}</div>
                          ) : null
                        })()}
                      </div>
                    )}
                    <JobCard 
                      job={job}
                      getSiteName={getSiteName}
                      getMaterialName={getMaterialName}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedJob?.id === job.id}
                    />
                  </div>
                ))}
                {groupedJobs.allSubcontractorJobs.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    אין נסיעות לקבלני משנה
                  </p>
                )}
              </div>
            </div>

            {/* Truck Columns - All trucks */}
            {groupedJobs.byTruck.map(({ truck, jobs: truckJobs }) => (
              <div 
                key={truck.id} 
                className={`
                  bg-white rounded-lg shadow p-4 min-w-[280px] w-[280px] flex-shrink-0
                  transition-all duration-200
                  ${draggedJob && draggedJob.truck_id !== truck.id ? 'ring-2 ring-orange-400 ring-offset-2' : ''}
                `}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(truck.id)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      🚛
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Truck Number - Primary */}
                    <h3 className="font-bold text-gray-900 text-lg truncate">{truck.plate_number}</h3>
                    {/* Driver Name - Secondary (if assigned to any job) */}
                    {(() => {
                      const jobWithDriver = truckJobs.find(j => j.driver_id)
                      if (jobWithDriver?.driver_id) {
                        const driver = drivers.find(d => d.id === jobWithDriver.driver_id)
                        return driver ? (
                          <p className="text-xs text-orange-600 font-medium truncate">{driver.name}</p>
                        ) : null
                      }
                      return null
                    })()}
                    <p className="text-xs text-gray-500">{truckJobs.length} נסיעות</p>
                  </div>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                  {truckJobs.map(job => (
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
                  {truckJobs.length === 0 && (
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
        ) : viewMode === 'subcontractors' ? (
          /* Subcontractors View - Each subcontractor gets its own column */
          <div className="relative">
            {/* Scroll Navigation Buttons */}
            <button
              onClick={scrollRight}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all"
              title="גלול שמאלה"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={scrollLeft}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all"
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
                scrollbarColor: '#9333EA #E5E7EB'
              }}
            >
            {/* Unassigned Jobs Column */}
            <div 
              className={`
                bg-gray-50 rounded-lg p-4 min-w-[280px] w-[280px] flex-shrink-0
                transition-all duration-200
                ${draggedJob ? 'ring-2 ring-purple-400 ring-offset-2 bg-purple-50' : ''}
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
                  <div className="text-xs text-purple-600 bg-purple-100 rounded p-2 mb-2 text-center">
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
                    showAssignActions
                    onAssignTruck={openTruckAssignModal}
                    onAssignSubcontractor={openSubcontractorAssign}
                  />
                ))}
                {groupedJobs.unassigned.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    כל הנסיעות משובצות
                  </p>
                )}
              </div>
            </div>

            {/* Subcontractor Columns - Each subcontractor gets own column */}
            {groupedJobs.bySubcontractor.map(({ subcontractor, jobs: subcontractorJobs }) => (
              <div 
                key={subcontractor.id} 
                className={`
                  bg-white rounded-lg shadow p-4 min-w-[280px] w-[280px] flex-shrink-0
                  transition-all duration-200
                  ${draggedJob && draggedJob.subcontractor_id !== subcontractor.id ? 'ring-2 ring-purple-400 ring-offset-2' : ''}
                `}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(null, subcontractor.id)}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      👷
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Truck Number - Primary */}
                    <h3 className="font-bold text-purple-900 text-lg truncate">
                      🚛 {subcontractor.truck_plate_number || `קבלן #${subcontractor.id}`}
                    </h3>
                    {/* Subcontractor Name - Secondary (if exists) */}
                    {subcontractor.name && (
                      <p className="text-xs text-purple-600 font-medium truncate">{subcontractor.name}</p>
                    )}
                    <p className="text-xs text-gray-500">{subcontractorJobs.length} נסיעות</p>
                    {subcontractor.phone && (
                      <p className="text-xs text-gray-400 truncate">📱 {subcontractor.phone}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-2">
                  {subcontractorJobs.map(job => (
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
                  {subcontractorJobs.length === 0 && (
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
        ) : null}
      </div>
    </DashboardLayout>
  )
}

function JobCard({ job, getSiteName, getMaterialName, onDragStart, onDragEnd, isDragging, showAssignActions, onAssignTruck, onAssignSubcontractor }: { 
  job: Job
  getSiteName: (id: number | null) => string
  getMaterialName: (id: number | null) => string
  onDragStart?: (job: Job) => void
  onDragEnd?: () => void
  isDragging?: boolean
  showAssignActions?: boolean
  onAssignTruck?: (job: Job) => void
  onAssignSubcontractor?: (job: Job) => void
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
          {job.planned_qty} {billingUnitLabels[job.unit] || t(`billingUnit.${job.unit}`)}
        </div>
      </div>
      {showAssignActions && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onAssignTruck?.(job)
            }}
            className="flex-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-1.5 hover:bg-orange-100"
          >
            שיבוץ משאית
          </button>
          <button
            type="button"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onAssignSubcontractor?.(job)
            }}
            className="flex-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded px-2 py-1.5 hover:bg-purple-100"
          >
            קבלן משנה
          </button>
        </div>
      )}
    </div>
  )
}
