'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { trucksApi, driversApi } from '@/lib/api'
import { getTruckTypeLabel, TRUCK_TYPES } from '@/lib/constants'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { formatDate } from '@/lib/utils'
import { Truck, Users, Plus, Search, Edit, AlertTriangle, Shield, Wrench, FileText, Calendar } from 'lucide-react'
import type { Truck as TruckType, Driver } from '@/types'
import Link from 'next/link'

type TabType = 'trucks' | 'drivers'

export default function FleetPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<TabType>('trucks')
  const [trucks, setTrucks] = useState<TruckType[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('')  // Filter by truck type
  const [statusFilter, setStatusFilter] = useState('')  // Filter by document status

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [trucksRes, driversRes] = await Promise.all([
        trucksApi.list(),
        driversApi.list()
      ])
      setTrucks(trucksRes.data)
      setDrivers(driversRes.data)
    } catch (error) {
      console.error('Failed to load fleet data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to check if document is expiring soon or expired
  const getExpiryStatus = (expiryDate: string | null | undefined) => {
    if (!expiryDate) return { status: 'missing', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    
    const today = new Date()
    const expiry = new Date(expiryDate)
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { status: 'expired', days: Math.abs(diffDays), color: 'text-red-600', bgColor: 'bg-red-100' }
    } else if (diffDays <= 30) {
      return { status: 'expiring', days: diffDays, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    } else {
      return { status: 'valid', days: diffDays, color: 'text-green-600', bgColor: 'bg-green-100' }
    }
  }

  const filteredTrucks = trucks.filter(t => {
    const matchesSearch = t.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.model?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === '' || t.truck_type === typeFilter
    
    let matchesStatus = true
    if (statusFilter === 'expired') {
      const insuranceStatus = getExpiryStatus(t.insurance_expiry)
      const testStatus = getExpiryStatus(t.test_expiry)
      matchesStatus = insuranceStatus.status === 'expired' || testStatus.status === 'expired'
    } else if (statusFilter === 'expiring') {
      const insuranceStatus = getExpiryStatus(t.insurance_expiry)
      const testStatus = getExpiryStatus(t.test_expiry)
      matchesStatus = insuranceStatus.status === 'expiring' || testStatus.status === 'expiring'
    } else if (statusFilter === 'valid') {
      const insuranceStatus = getExpiryStatus(t.insurance_expiry)
      const testStatus = getExpiryStatus(t.test_expiry)
      matchesStatus = insuranceStatus.status === 'valid' && testStatus.status === 'valid'
    }
    
    return matchesSearch && matchesType && matchesStatus
  })

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculate alerts
  const expiredItems: Array<{ type: string, name: string, doc: string, days: number }> = []
  const expiringItems: Array<{ type: string, name: string, doc: string, days: number }> = []
  
  // Check trucks
  trucks.forEach(truck => {
    const insuranceStatus = getExpiryStatus(truck.insurance_expiry)
    const testStatus = getExpiryStatus(truck.test_expiry)
    
    if (insuranceStatus.status === 'expired') {
      expiredItems.push({ 
        type: 'משאית', 
        name: truck.plate_number, 
        doc: 'ביטוח',
        days: insuranceStatus.days || 0
      })
    } else if (insuranceStatus.status === 'expiring') {
      expiringItems.push({ 
        type: 'משאית', 
        name: truck.plate_number, 
        doc: 'ביטוח',
        days: insuranceStatus.days || 0
      })
    }
    
    if (testStatus.status === 'expired') {
      expiredItems.push({ 
        type: 'משאית', 
        name: truck.plate_number, 
        doc: 'טסט',
        days: testStatus.days || 0
      })
    } else if (testStatus.status === 'expiring') {
      expiringItems.push({ 
        type: 'משאית', 
        name: truck.plate_number, 
        doc: 'טסט',
        days: testStatus.days || 0
      })
    }
  })
  
  // Check drivers
  drivers.forEach(driver => {
    const licenseStatus = getExpiryStatus(driver.license_expiry)
    
    if (licenseStatus.status === 'expired') {
      expiredItems.push({ 
        type: 'נהג', 
        name: driver.name, 
        doc: 'רישיון נהיגה',
        days: licenseStatus.days || 0
      })
    } else if (licenseStatus.status === 'expiring') {
      expiringItems.push({ 
        type: 'נהג', 
        name: driver.name, 
        doc: 'רישיון נהיגה',
        days: licenseStatus.days || 0
      })
    }
  })

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ניהול צי</h1>
            <p className="text-gray-600 mt-1">משאיות, נגררים ונהגים</p>
          </div>
        </div>

        {/* Alerts Section */}
        {(expiredItems.length > 0 || expiringItems.length > 0) && (
          <div className="space-y-3">
            {/* Expired Documents */}
            {expiredItems.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-red-800 font-medium">מסמכים שפגו ({expiredItems.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {expiredItems.map((item, index) => (
                    <div key={index} className="text-sm text-red-700 bg-red-100 rounded px-2 py-1">
                      <span className="font-medium">{item.name}</span> - {item.doc} 
                      <span className="text-red-600"> (פג לפני {item.days} יום)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Expiring Documents */}
            {expiringItems.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                  <h3 className="text-yellow-800 font-medium">מסמכים שפוגים בקרוב ({expiringItems.length})</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {expiringItems.map((item, index) => (
                    <div key={index} className="text-sm text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                      <span className="font-medium">{item.name}</span> - {item.doc} 
                      <span className="text-yellow-600"> (פג בעוד {item.days} יום)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-4">
            <button
              onClick={() => setActiveTab('trucks')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'trucks'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                <span>משאיות ({trucks.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`pb-3 px-2 border-b-2 transition-colors ${
                activeTab === 'drivers'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>נהגים ({drivers.length})</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Search Bar and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'trucks' ? 'חפש לפי מספר רכב או דגם...' : 'חפש לפי שם או טלפון...'}
              className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Type Filter for Trucks */}
          {activeTab === 'trucks' && (
            <>
              <div className="min-w-0 w-48">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">כל סוגי הרכב</option>
                  {TRUCK_TYPES.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Status Filter */}
              <div className="min-w-0 w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="">כל הסטטוסים</option>
                  <option value="valid">תקין (מסמכים תקפים)</option>
                  <option value="expiring">פג בקרוב (תוך 30 יום)</option>
                  <option value="expired">פג תוקף</option>
                </select>
              </div>
            </>
          )}
          {activeTab === 'trucks' && (
            <Link
              href="/trucks/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>הוספת משאית</span>
            </Link>
          )}
          {activeTab === 'drivers' && (
            <Link
              href="/drivers/new"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>הוספת נהג</span>
            </Link>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Trucks Tab */}
            {activeTab === 'trucks' && (
              <div className="bg-white rounded-lg shadow">
                {filteredTrucks.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? 'לא נמצאו משאיות' : 'אין משאיות במערכת'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            מספר רכב
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            דגם
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            סוג
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            קיבולת (טון)
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ביטוח
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            טסט
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            סטטוס
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            פעולות
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTrucks.map((truck) => (
                          <tr key={truck.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Truck className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {truck.plate_number}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {truck.model || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {getTruckTypeLabel(truck.truck_type)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {truck.capacity_ton || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {(() => {
                                const insuranceStatus = getExpiryStatus(truck.insurance_expiry)
                                return (
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    {truck.insurance_expiry ? (
                                      <div className="flex flex-col">
                                        <span className="text-xs text-gray-600">
                                          {formatDate(truck.insurance_expiry)}
                                        </span>
                                        <span className={`text-xs font-medium ${insuranceStatus.color}`}>
                                          {insuranceStatus.status === 'expired' 
                                            ? `פג לפני ${insuranceStatus.days} יום`
                                            : insuranceStatus.status === 'expiring'
                                            ? `פג בעוד ${insuranceStatus.days} יום`
                                            : insuranceStatus.status === 'valid'
                                            ? `תקף עוד ${insuranceStatus.days} יום`
                                            : 'לא הוגדר'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-500">לא הוגדר</span>
                                    )}
                                    {insuranceStatus.status === 'expired' && (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {(() => {
                                const testStatus = getExpiryStatus(truck.test_expiry)
                                return (
                                  <div className="flex items-center gap-2">
                                    <Wrench className="w-4 h-4 text-green-500" />
                                    {truck.test_expiry ? (
                                      <div className="flex flex-col">
                                        <span className="text-xs text-gray-600">
                                          {formatDate(truck.test_expiry)}
                                        </span>
                                        <span className={`text-xs font-medium ${testStatus.color}`}>
                                          {testStatus.status === 'expired' 
                                            ? `פג לפני ${testStatus.days} יום`
                                            : testStatus.status === 'expiring'
                                            ? `פג בעוד ${testStatus.days} יום`
                                            : testStatus.status === 'valid'
                                            ? `תקף עוד ${testStatus.days} יום`
                                            : 'לא הוגדר'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-500">לא הוגדר</span>
                                    )}
                                    {testStatus.status === 'expired' && (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                truck.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {truck.is_active ? 'פעיל' : 'לא פעיל'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link
                                href={`/trucks/${truck.id}`}
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                עריכה
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <div className="bg-white rounded-lg shadow">
                {filteredDrivers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {searchQuery ? 'לא נמצאו נהגים' : 'אין נהגים במערכת'}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            שם
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            טלפון
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            רישיון
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            תוקף רישיון
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            סטטוס
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            פעולות
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredDrivers.map((driver) => (
                          <tr key={driver.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-blue-600 font-medium text-sm">
                                    {driver.name.charAt(0)}
                                  </span>
                                </div>
                                <span className="font-medium text-gray-900">
                                  {driver.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {driver.phone || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {driver.license_type || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {(() => {
                                const licenseStatus = getExpiryStatus(driver.license_expiry)
                                return (
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-purple-500" />
                                    {driver.license_expiry ? (
                                      <div className="flex flex-col">
                                        <span className="text-xs text-gray-600">
                                          {formatDate(driver.license_expiry)}
                                        </span>
                                        <span className={`text-xs font-medium ${licenseStatus.color}`}>
                                          {licenseStatus.status === 'expired' 
                                            ? `פג לפני ${licenseStatus.days} יום`
                                            : licenseStatus.status === 'expiring'
                                            ? `פג בעוד ${licenseStatus.days} יום`
                                            : licenseStatus.status === 'valid'
                                            ? `תקף עוד ${licenseStatus.days} יום`
                                            : 'לא הוגדר'}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-xs text-gray-500">לא הוגדר</span>
                                    )}
                                    {licenseStatus.status === 'expired' && (
                                      <AlertTriangle className="w-4 h-4 text-red-500" />
                                    )}
                                  </div>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                driver.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {driver.is_active ? 'פעיל' : 'לא פעיל'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <Link
                                href={`/drivers/${driver.id}`}
                                className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              >
                                <Edit className="w-4 h-4" />
                                עריכה
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
