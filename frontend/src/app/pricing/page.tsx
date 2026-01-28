'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useI18n } from '@/lib/i18n'
import { priceListsApi, customersApi, materialsApi, sitesApi } from '@/lib/api'
import { DollarSign, Plus, Edit, Trash2, Filter, Calendar } from 'lucide-react'
import type { PriceList, Customer, Material, Site } from '@/types'
import Link from 'next/link'

export default function PricingPage() {
  const router = useRouter()
  const { t } = useI18n()
  
  const [priceLists, setPriceLists] = useState<PriceList[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [filterCustomerId, setFilterCustomerId] = useState<number | ''>('')
  const [filterMaterialId, setFilterMaterialId] = useState<number | ''>('')

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    loadPriceLists()
  }, [filterCustomerId, filterMaterialId])

  const loadData = async () => {
    try {
      const [customersRes, materialsRes, sitesRes] = await Promise.all([
        customersApi.getAll(),
        materialsApi.getAll(),
        sitesApi.getAll(),
      ])
      setCustomers(customersRes.data)
      setMaterials(materialsRes.data)
      setSites(sitesRes.data)
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  const loadPriceLists = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (filterCustomerId) params.customer_id = filterCustomerId
      if (filterMaterialId) params.material_id = filterMaterialId
      
      const response = await priceListsApi.getAll(params)
      setPriceLists(response.data)
    } catch (error) {
      console.error('Failed to load price lists:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCustomerName = (customerId?: number) => {
    if (!customerId) return '🌍 כללי (כל הלקוחות)'
    const customer = customers.find(c => c.id === customerId)
    return customer?.name || `לקוח #${customerId}`
  }

  const getMaterialName = (materialId: number) => {
    const material = materials.find(m => m.id === materialId)
    return material?.name_hebrew || material?.name || `חומר #${materialId}`
  }

  const getSiteName = (siteId?: number) => {
    if (!siteId) return 'כל האתרים'
    const site = sites.find(s => s.id === siteId)
    return site?.name || `אתר #${siteId}`
  }

  const handleDelete = async (priceList: PriceList) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המחירון?\n\nחומר: ${getMaterialName(priceList.material_id)}\nלקוח: ${getCustomerName(priceList.customer_id)}`)) {
      return
    }

    try {
      await priceListsApi.delete(priceList.id)
      setPriceLists(prev => prev.filter(p => p.id !== priceList.id))
      alert('המחירון נמחק בהצלחה')
    } catch (error: any) {
      alert(`שגיאה במחיקת המחירון: ${error.response?.data?.detail || error.message}`)
    }
  }

  const isExpired = (validTo?: string) => {
    if (!validTo) return false
    return new Date(validTo) < new Date()
  }

  const isActive = (validFrom: string, validTo?: string) => {
    const now = new Date()
    const from = new Date(validFrom)
    if (now < from) return false
    if (validTo && now > new Date(validTo)) return false
    return true
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <DollarSign className="w-7 h-7 text-blue-600" />
              מחירונים
            </h1>
            <p className="text-gray-600 mt-1">ניהול מחירים לפי לקוח, חומר ומסלול</p>
          </div>
          <Link
            href="/pricing/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            מחירון חדש
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">סינון</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                לקוח
              </label>
              <select
                value={filterCustomerId}
                onChange={(e) => setFilterCustomerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">כל הלקוחות</option>
                <option value="0">כללי בלבד</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                חומר
              </label>
              <select
                value={filterMaterialId}
                onChange={(e) => setFilterMaterialId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">כל החומרים</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name_hebrew || material.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterCustomerId('')
                  setFilterMaterialId('')
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                נקה סינון
              </button>
            </div>
          </div>
        </div>

        {/* Pricing Logic */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">לוגיקת עדיפות במחירונים</h3>
          <ul className="list-disc pr-5 text-sm text-blue-800 space-y-1">
            <li>מחירון לקוח ספציפי תמיד גובר על מחירון כללי.</li>
            <li>בתוך אותו סוג מחירון: קודם מסלול ספציפי (מאתר + לאתר), ואז כללי ללא מסלול.</li>
            <li>אם יש כמה התאמות, נבחר מחירון עם תאריך התחלה הכי חדש.</li>
            <li>אם אין מחירון ללקוח, משתמשים במחירון כללי בלבד.</li>
          </ul>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">סה"כ מחירונים</p>
            <p className="text-2xl font-bold text-blue-600">{priceLists.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">מחירונים כלליים</p>
            <p className="text-2xl font-bold text-green-600">
              {priceLists.filter(p => !p.customer_id).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">מחירונים ללקוח</p>
            <p className="text-2xl font-bold text-purple-600">
              {priceLists.filter(p => p.customer_id).length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600 mb-1">פגי תוקף</p>
            <p className="text-2xl font-bold text-red-600">
              {priceLists.filter(p => isExpired(p.valid_to)).length}
            </p>
          </div>
        </div>

        {/* Price Lists Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">סטטוס</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">לקוח</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">חומר</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">מסלול</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">מחיר בסיס</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">תוספות</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">תוקף</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      טוען נתונים...
                    </td>
                  </tr>
                ) : priceLists.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      אין מחירונים להצגה
                    </td>
                  </tr>
                ) : (
                  priceLists.map((priceList) => (
                    <tr key={priceList.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {isActive(priceList.valid_from, priceList.valid_to) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            ✓ פעיל
                          </span>
                        ) : isExpired(priceList.valid_to) ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                            ✗ פג תוקף
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ עתידי
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {priceList.customer_id ? (
                          <span className="text-gray-900 font-medium">
                            {getCustomerName(priceList.customer_id)}
                          </span>
                        ) : (
                          <span className="text-blue-600 font-medium">
                            🌍 כללי
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {getMaterialName(priceList.material_id)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {priceList.from_site_id || priceList.to_site_id ? (
                          <div className="text-xs">
                            {priceList.from_site_id && (
                              <div>מ: {getSiteName(priceList.from_site_id)}</div>
                            )}
                            {priceList.to_site_id && (
                              <div>ל: {getSiteName(priceList.to_site_id)}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">כל המסלולים</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-bold text-green-600">
                          ₪{Number(priceList.base_price).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          ל{priceList.unit === 'TON' ? 'טון' : priceList.unit === 'M3' ? 'מ״ק' : priceList.unit === 'TRIP' ? 'נסיעה' : 'ק״מ'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {priceList.min_charge && (
                          <div>מינימום: ₪{Number(priceList.min_charge).toFixed(0)}</div>
                        )}
                        {priceList.trip_surcharge && (
                          <div className="font-medium text-orange-600">נסיעה: +₪{Number(priceList.trip_surcharge).toFixed(0)}</div>
                        )}
                        {priceList.wait_fee_per_hour && (
                          <div>המתנה: ₪{Number(priceList.wait_fee_per_hour).toFixed(0)}/שעה</div>
                        )}
                        {priceList.night_surcharge_pct && (
                          <div>לילה: +{Number(priceList.night_surcharge_pct).toFixed(0)}%</div>
                        )}
                        {!priceList.min_charge && !priceList.trip_surcharge && !priceList.wait_fee_per_hour && !priceList.night_surcharge_pct && (
                          <span className="text-gray-400">אין</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(priceList.valid_from).toLocaleDateString('he-IL')}
                        </div>
                        {priceList.valid_to && (
                          <div className="text-gray-500">
                            עד: {new Date(priceList.valid_to).toLocaleDateString('he-IL')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/pricing/${priceList.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="ערוך"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(priceList)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="מחק"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Help Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 טיפים למחירונים:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>מחירון כללי</strong> - חל על כל הלקוחות (ללא בחירת לקוח ספציפי)</li>
            <li>• <strong>מחירון ללקוח</strong> - עדיפות גבוהה יותר ממחירון כללי</li>
            <li>• <strong>מסלול ספציפי</strong> - ניתן להגדיר מחיר למסלול מאתר מסוים לאתר מסוים</li>
            <li>• <strong>תוספות</strong> - מינימום חיוב, תוספת המתנה ותוספת לילה</li>
            <li>• <strong>תוקף</strong> - ניתן להגדיר תאריך תחילה וסיום לכל מחירון</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
