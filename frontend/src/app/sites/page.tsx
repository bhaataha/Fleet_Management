'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { sitesApi, customersApi } from '@/lib/api'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Search, Plus, Edit, Trash2, MapPin } from 'lucide-react'
import Link from 'next/link'
import type { Site, Customer } from '@/types'

export default function SitesPage() {
  const { t } = useI18n()
  const [sites, setSites] = useState<Site[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sitesRes, customersRes] = await Promise.all([
        sitesApi.list(),
        customersApi.list()
      ])
      setSites(sitesRes.data)
      setCustomers(customersRes.data)
    } catch (error) {
      console.error('Failed to load sites:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSites = sites.filter(site =>
    site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCustomerName = (customerId: number | null) => {
    if (!customerId) return '🏭 כללי'
    return customers.find(c => c.id === customerId)?.name || '-'
  }

  const handleDelete = async (id: number) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את האתר?')) return
    
    try {
      await sitesApi.delete(id)
      alert('האתר נמחק בהצלחה!')
      loadData()
    } catch (error) {
      console.error('Failed to delete site:', error)
      alert('שגיאה במחיקת האתר')
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('sites.title')}</h1>
            <p className="text-gray-600 mt-1">אתרי עבודה / פרויקטים</p>
          </div>
          <Link
            href="/sites/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            {t('sites.addSite')}
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      שם האתר
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      לקוח
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      כתובת
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      שעות פעילות
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      פעולות
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSites.map((site) => (
                    <tr key={site.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 text-gray-400 ml-2" />
                          <span className="font-medium text-gray-900">{site.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {getCustomerName(site.customer_id)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {site.address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {site.opening_hours || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/sites/${site.id}/edit`}
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(site.id)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredSites.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {searchTerm ? 'לא נמצאו תוצאות' : 'אין אתרים'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
