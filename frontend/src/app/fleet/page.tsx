'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { trucksApi, driversApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Truck, Users, Plus, Search, Edit } from 'lucide-react'
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

  const filteredTrucks = trucks.filter(t =>
    t.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.model?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredDrivers = drivers.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

        {/* Search Bar */}
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
                            קיבולת (מ"ק)
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
                              {truck.truck_type || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {truck.capacity_ton || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                              {truck.capacity_m3 || '-'}
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
