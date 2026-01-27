'use client'

import { useEffect, useState } from 'react'
import { Truck, MapPin, Clock, AlertCircle } from 'lucide-react'

interface Job {
  id: number
  scheduled_date: string
  status: string
  customer?: { name: string }
  from_site?: { name: string }
  to_site?: { name: string }
  material?: { name: string }
  planned_qty: number
  unit: string
}

export default function MobileHomePage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('נהג')

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setUserName(user.name || 'נהג')
    
    // Mock data for now
    setJobs([
      {
        id: 1,
        scheduled_date: new Date().toISOString(),
        status: 'ASSIGNED',
        customer: { name: 'חברת בניה א' },
        from_site: { name: 'מחצבה מישור' },
        to_site: { name: 'אתר בניה רמת גן' },
        material: { name: 'חצץ' },
        planned_qty: 20,
        unit: 'TON'
      },
      {
        id: 2,
        scheduled_date: new Date().toISOString(),
        status: 'PLANNED',
        customer: { name: 'חברת בניה ב' },
        from_site: { name: 'מחצבה צפון' },
        to_site: { name: 'אתר בניה תל אביב' },
        material: { name: 'עפר' },
        planned_qty: 15,
        unit: 'TON'
      }
    ])
    setLoading(false)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'bg-blue-100 text-blue-700'
      case 'ENROUTE': return 'bg-yellow-100 text-yellow-700'
      case 'LOADED': return 'bg-purple-100 text-purple-700'
      case 'DELIVERED': return 'bg-green-100 text-green-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ASSIGNED': return 'שובץ'
      case 'ENROUTE': return 'בדרך'
      case 'LOADED': return 'נטען'
      case 'DELIVERED': return 'נמסר'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Welcome Card */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">שלום, {userName}! 👋</h2>
        <p className="text-blue-100">יש לך {jobs.length} משימות להיום</p>
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{jobs.filter(j => j.status === 'ASSIGNED').length}</div>
            <div className="text-sm text-blue-100">פעילות</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <div className="text-3xl font-bold">{jobs.filter(j => j.status === 'DELIVERED').length}</div>
            <div className="text-sm text-blue-100">הושלמו</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <MapPin className="w-6 h-6 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">ניווט</span>
        </button>
        <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <Truck className="w-6 h-6 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">המשאית שלי</span>
        </button>
        <button className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex flex-col items-center gap-2 active:scale-95 transition-transform">
          <AlertCircle className="w-6 h-6 text-blue-600" />
          <span className="text-xs font-medium text-gray-700">דווח בעיה</span>
        </button>
      </div>

      {/* Jobs List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">משימות להיום</h3>
        
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 active:scale-98 transition-transform"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(job.status)}`}>
                {getStatusText(job.status)}
              </span>
              <span className="text-sm text-gray-500 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(job.scheduled_date).toLocaleTimeString('he-IL', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>

            {/* Customer */}
            <div className="mb-2">
              <div className="text-sm font-semibold text-gray-900">
                {job.customer?.name}
              </div>
            </div>

            {/* Route */}
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 text-sm">
                <div className="text-gray-900 font-medium">{job.from_site?.name}</div>
                <div className="text-gray-400 my-1">↓</div>
                <div className="text-gray-900 font-medium">{job.to_site?.name}</div>
              </div>
            </div>

            {/* Material */}
            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">
                <span className="font-medium text-gray-900">{job.material?.name}</span>
              </div>
              <div className="text-blue-600 font-semibold">
                {job.planned_qty} {job.unit === 'TON' ? 'טון' : 'מ״ק'}
              </div>
            </div>

            {/* Action Button */}
            <button className="w-full mt-3 bg-blue-600 text-white py-2.5 rounded-lg font-medium active:bg-blue-700 transition-colors">
              התחל נסיעה
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
