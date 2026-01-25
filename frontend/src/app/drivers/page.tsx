'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n'
import { driversApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Plus, Edit, Trash2, User, Phone } from 'lucide-react'
import Link from 'next/link'
import type { Driver } from '@/types'

export default function DriversPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDrivers()
  }, [])

  const loadDrivers = async () => {
    setLoading(true)
    try {
      const res = await driversApi.list()
      setDrivers(res.data)
    } catch (error) {
      console.error('Failed to load drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (driver: Driver) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את הנהג "${driver.name}"?\n\nשים לב: אם לנהג יש נסיעות משויכות, המחיקה עלולה להיכשל.`)) {
      return
    }

    try {
      await driversApi.delete(driver.id)
      // Remove from local state
      setDrivers(prevDrivers => prevDrivers.filter(d => d.id !== driver.id))
      alert('הנהג נמחק בהצלחה')
    } catch (error: any) {
      console.error('Failed to delete driver:', error)
      const errorMessage = error.response?.data?.detail || 'שגיאה במחיקת הנהג'
      alert(`שגיאה: ${errorMessage}`)
    }
  }

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license_type?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('fleet.drivers')}</h1>
            <p className="text-gray-600 mt-1">ניהול נהגים במערכת</p>
          </div>
          <Link 
            href="/drivers/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('fleet.addDriver')}
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">סה״כ נהגים</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{drivers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">נהגים פעילים</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {drivers.filter(d => d.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">נהגים לא פעילים</p>
                <p className="text-2xl font-bold text-gray-400 mt-1">
                  {drivers.filter(d => !d.is_active).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="חיפוש לפי שם, טלפון או סוג רישיון..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
          ) : filteredDrivers.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'לא נמצאו נהגים התואמים לחיפוש' : 'אין נהגים במערכת'}
              </p>
              {!searchTerm && (
                <Link
                  href="/drivers/new"
                  className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  הוסף נהג ראשון
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      נהג
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      טלפון
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      סוג רישיון
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      סטטוס
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDrivers.map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center ml-3">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{driver.name}</div>
                            <div className="text-xs text-gray-500">ID: {driver.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {driver.phone || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {driver.license_type || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          driver.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {driver.is_active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/drivers/${driver.id}`)}
                            className="text-blue-600 hover:text-blue-800"
                            title="ערוך"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(driver)}
                            className="text-red-600 hover:text-red-800"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Summary Footer */}
        {!loading && filteredDrivers.length > 0 && (
          <div className="text-sm text-gray-600 text-center">
            מציג {filteredDrivers.length} מתוך {drivers.length} נהגים
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
