'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import api, { customersApi, sitesApi, materialsApi, driversApi, trucksApi } from '@/lib/api'
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  Truck, 
  User, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Phone,
  Mail
} from 'lucide-react'

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

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useI18n()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [statusEvents, setStatusEvents] = useState<any[]>([])
  
  // Reference data
  const [customer, setCustomer] = useState<any>(null)
  const [fromSite, setFromSite] = useState<any>(null)
  const [toSite, setToSite] = useState<any>(null)
  const [material, setMaterial] = useState<any>(null)
  const [driver, setDriver] = useState<any>(null)
  const [truck, setTruck] = useState<any>(null)

  useEffect(() => {
    if (params.id) {
      loadJobDetails()
    }
  }, [params.id])

  const loadJobDetails = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/jobs/${params.id}`)
      const jobData = response.data
      setJob(jobData)
      
      // Load all related data in parallel
      const promises = []
      
      if (jobData.customer_id) {
        promises.push(
          customersApi.get(jobData.customer_id)
            .then(res => setCustomer(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.from_site_id) {
        promises.push(
          sitesApi.get(jobData.from_site_id)
            .then(res => setFromSite(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.to_site_id) {
        promises.push(
          sitesApi.get(jobData.to_site_id)
            .then(res => setToSite(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.material_id) {
        promises.push(
          materialsApi.get(jobData.material_id)
            .then(res => setMaterial(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.driver_id) {
        promises.push(
          driversApi.get(jobData.driver_id)
            .then(res => setDriver(res.data))
            .catch(() => {})
        )
      }
      
      if (jobData.truck_id) {
        promises.push(
          trucksApi.get(jobData.truck_id)
            .then(res => setTruck(res.data))
            .catch(() => {})
        )
      }
      
      await Promise.all(promises)
      
      // Try to load status events
      try {
        const eventsResponse = await api.get(`/jobs/${params.id}/status-events`)
        setStatusEvents(eventsResponse.data)
      } catch (err) {
        console.log('No status events endpoint')
      }
    } catch (error) {
      console.error('Failed to load job:', error)
      alert('שגיאה בטעינת הנסיעה')
      router.push('/jobs')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`האם לשנות סטטוס ל-${t(`jobs.status.${newStatus}`)}?`)) {
      return
    }

    try {
      await api.post(`/jobs/${params.id}/status`, { status: newStatus })
      alert('הסטטוס עודכן בהצלחה!')
      loadJobDetails()
    } catch (error: any) {
      console.error('Failed to update status:', error)
      alert(error.response?.data?.detail || 'שגיאה בעדכון סטטוס')
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </DashboardLayout>
    )
  }

  if (!job) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/jobs')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">נסיעה #{job.id}</h1>
              <p className="text-gray-600 mt-1">
                {new Date(job.scheduled_date).toLocaleDateString('he-IL')}
              </p>
            </div>
          </div>
          
          <span className={`px-4 py-2 text-sm font-medium rounded-full ${STATUS_COLORS[job.status]}`}>
            {t(`jobs.status.${job.status}`)}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                מסלול
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">מאתר</p>
                    <p className="font-medium text-lg">{fromSite?.name || `אתר #${job.from_site_id}`}</p>
                    {fromSite?.address && (
                      <p className="text-sm text-gray-500 mt-1">{fromSite.address}</p>
                    )}
                  </div>
                  <div className="text-2xl text-blue-600 font-bold">←</div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">לאתר</p>
                    <p className="font-medium text-lg">{toSite?.name || `אתר #${job.to_site_id}`}</p>
                    {toSite?.address && (
                      <p className="text-sm text-gray-500 mt-1">{toSite.address}</p>
                    )}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">לקוח</p>
                  <p className="font-medium text-lg">{customer?.name || `לקוח #${job.customer_id}`}</p>
                  {customer?.contact_name && (
                    <p className="text-sm text-gray-500 mt-1">
                      איש קשר: {customer.contact_name}
                      {customer.phone && ` • ${customer.phone}`}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Material & Quantity */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                חומר וכמות
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">חומר</p>
                  <p className="font-medium text-lg">{material?.name || `חומר #${job.material_id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">כמות מתוכננת</p>
                  <p className="font-medium text-lg">{job.planned_qty} {t(`units.${job.unit}`)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">כמות בפועל</p>
                  <p className="font-medium text-lg">
                    {job.actual_qty ? `${job.actual_qty} ${t(`units.${job.unit}`)}` : '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Fleet */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-600" />
                צי
              </h3>
              <div className="space-y-4">
                {/* Driver */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">נהג</p>
                  {driver ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{driver.name}</p>
                        {driver.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <Phone className="w-3 h-3" />
                            <span>{driver.phone}</span>
                          </div>
                        )}
                        {driver.license_type && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            רישיון {driver.license_type}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                      {job.driver_id ? `נהג #${job.driver_id}` : 'לא משובץ נהג'}
                    </p>
                  )}
                </div>
                
                {/* Truck */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">משאית</p>
                  {truck ? (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <Truck className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-lg">{truck.plate_number}</p>
                        {truck.model && (
                          <p className="text-sm text-gray-600">{truck.model}</p>
                        )}
                        {truck.capacity_ton && (
                          <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded">
                            {truck.capacity_ton} טון
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic p-3 bg-gray-50 rounded-lg">
                      {job.truck_id ? `משאית #${job.truck_id}` : 'לא משובצת משאית'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {statusEvents.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600" />
                  ציר זמן
                </h3>
                <div className="space-y-4">
                  {statusEvents.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{t(`jobs.status.${event.status}`)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.event_time).toLocaleString('he-IL')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">פעולות</h3>
              <div className="space-y-2">
                {job.status === 'PLANNED' && (
                  <button
                    onClick={() => handleStatusChange('ASSIGNED')}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    שבץ נסיעה
                  </button>
                )}
                {job.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleStatusChange('ENROUTE_PICKUP')}
                    className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    יציאה לטעינה
                  </button>
                )}
                {job.status === 'ENROUTE_PICKUP' && (
                  <button
                    onClick={() => handleStatusChange('LOADED')}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    נטען
                  </button>
                )}
                {job.status === 'LOADED' && (
                  <button
                    onClick={() => handleStatusChange('ENROUTE_DROPOFF')}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    יציאה לפריקה
                  </button>
                )}
                {job.status === 'ENROUTE_DROPOFF' && (
                  <button
                    onClick={() => handleStatusChange('DELIVERED')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    נמסר
                  </button>
                )}
                {job.status === 'DELIVERED' && (
                  <button
                    onClick={() => handleStatusChange('CLOSED')}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    סגור נסיעה
                  </button>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">הערה</p>
                  <p>סטטוס הנסיעה יעודכן אוטומטית כשהנהג יעדכן באפליקציה</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
