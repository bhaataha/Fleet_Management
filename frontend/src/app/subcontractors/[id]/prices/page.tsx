'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { subcontractorsApi, materialsApi } from '@/lib/api'
import { ArrowLeft, Plus, Edit2, Trash2, Calendar, DollarSign, AlertCircle, Copy } from 'lucide-react'
import Link from 'next/link'

export default function SubcontractorPricesPage() {
  const params = useParams()
  const router = useRouter()
  const subcontractorId = parseInt(params.id as string)

  const [subcontractor, setSubcontractor] = useState<any>(null)
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPrice, setEditingPrice] = useState<any>(null)
  const [filter, setFilter] = useState('active') // active, all, expired

  useEffect(() => {
    loadData()
  }, [subcontractorId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [subRes, pricesRes] = await Promise.all([
        subcontractorsApi.get(subcontractorId),
        subcontractorsApi.getPriceLists(subcontractorId)
      ])
      setSubcontractor(subRes.data)
      setPrices(pricesRes.data)
    } catch (error: any) {
      console.error('Failed to load data:', error)
      alert(error.response?.data?.detail || 'שגיאה בטעינת נתונים')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (priceId: number) => {
    if (!confirm('האם למחוק מחירון זה?')) return

    try {
      await subcontractorsApi.deletePriceList(subcontractorId, priceId)
      alert('המחירון נמחק בהצלחה')
      loadData()
    } catch (error: any) {
      console.error('Failed to delete price:', error)
      alert(error.response?.data?.detail || 'שגיאה במחיקת מחירון')
    }
  }

  const handleDuplicate = (price: any) => {
    // Create a copy with new dates
    const duplicated = {
      ...price,
      id: undefined, // Remove ID so it creates new
      valid_from: new Date().toISOString().split('T')[0],
      valid_to: '',
      notes: (price.notes || '') + ' (העתק)'
    }
    setEditingPrice(null)
    setShowAddForm(false)
    // Wait a tick then set the duplicated data
    setTimeout(() => {
      setEditingPrice(duplicated)
    }, 100)
  }

  const isExpired = (validTo: string | null) => {
    if (!validTo) return false
    return new Date(validTo) < new Date()
  }

  const isActive = (validFrom: string, validTo: string | null) => {
    const now = new Date()
    const from = new Date(validFrom)
    if (from > now) return false
    if (!validTo) return true
    return new Date(validTo) >= now
  }

  const filteredPrices = prices.filter(price => {
    if (filter === 'active') return isActive(price.valid_from, price.valid_to) && price.is_active !== false
    if (filter === 'expired') return isExpired(price.valid_to)
    return true
  }).sort((a, b) => new Date(b.valid_from).getTime() - new Date(a.valid_from).getTime()) // Sort by date, newest first

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!subcontractor) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            קבלן לא נמצא
          </div>
          <Link href="/subcontractors" className="mt-4 inline-block text-blue-600 hover:underline">
            ← חזור לקבלנים
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/subcontractors/${subcontractorId}`} className="text-blue-600 hover:underline flex items-center gap-2 mb-3">
            <ArrowLeft className="w-4 h-4" />
            <span>חזור לקבלן {subcontractor.name}</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">מחירון - {subcontractor.name}</h1>
              <p className="text-gray-600 mt-1">{subcontractor.company_name || subcontractor.phone}</p>
            </div>
            <button
              onClick={() => {
                setEditingPrice(null)
                setShowAddForm(true)
              }}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 flex items-center gap-2 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>מחירון חדש</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 p-1 flex gap-1">
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ✓ פעילים ({prices.filter(p => isActive(p.valid_from, p.valid_to)).length})
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              filter === 'expired'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⏰ פג תוקף ({prices.filter(p => isExpired(p.valid_to)).length})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📋 הכל ({prices.length})
          </button>
        </div>

        {/* Stats Summary */}
        {prices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
              <div className="text-sm text-green-700 mb-1">מחירונים פעילים</div>
              <div className="text-2xl font-bold text-green-900">
                {prices.filter(p => isActive(p.valid_from, p.valid_to)).length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
              <div className="text-sm text-orange-700 mb-1">פג תוקף</div>
              <div className="text-2xl font-bold text-orange-900">
                {prices.filter(p => isExpired(p.valid_to)).length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">עתידיים</div>
              <div className="text-2xl font-bold text-blue-900">
                {prices.filter(p => new Date(p.valid_from) > new Date()).length}
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <div className="text-sm text-purple-700 mb-1">סה״כ מחירונים</div>
              <div className="text-2xl font-bold text-purple-900">
                {prices.length}
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {(showAddForm || editingPrice) && (
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {editingPrice ? '✏️ עריכת מחירון' : '➕ הוספת מחירון חדש'}
            </h2>
            <PriceForm
              subcontractorId={subcontractorId}
              initialData={editingPrice}
              onSuccess={() => {
                setShowAddForm(false)
                setEditingPrice(null)
                loadData()
              }}
              onCancel={() => {
                setShowAddForm(false)
                setEditingPrice(null)
              }}
            />
          </div>
        )}

        {/* Prices Table */}
        {filteredPrices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {filter === 'active' ? 'אין מחירונים פעילים' : 
               filter === 'expired' ? 'אין מחירונים שפג תוקפם' :
               'אין מחירונים עדיין'}
            </p>
            {filter === 'active' && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 text-blue-600 hover:underline"
              >
                הוסף מחירון ראשון
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">חומר</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">מחיר נסיעה</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">מחיר/טון</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">מחיר/מ״ק</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">מחיר/ק״מ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">מינימום</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">תוקף מ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">תוקף עד</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase">סטטוס</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPrices.map((price) => (
                    <tr key={price.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {price.material_name ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            🧱 {price.material_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">כל החומרים</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {price.price_per_trip ? (
                          <span className="text-gray-900 font-medium">₪{Number(price.price_per_trip).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {price.price_per_ton ? (
                          <span className="text-gray-900 font-medium">₪{Number(price.price_per_ton).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {price.price_per_m3 ? (
                          <span className="text-gray-900 font-medium">₪{Number(price.price_per_m3).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {price.price_per_km ? (
                          <span className="text-gray-900 font-medium">₪{Number(price.price_per_km).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {price.min_charge ? (
                          <span className="text-gray-900 font-medium">₪{Number(price.min_charge).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(price.valid_from).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {price.valid_to ? new Date(price.valid_to).toLocaleDateString('he-IL') : '∞'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isActive(price.valid_from, price.valid_to) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ פעיל
                          </span>
                        ) : isExpired(price.valid_to) ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            פג תוקף
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            עתידי
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingPrice(price)
                              setShowAddForm(false)
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 hover:bg-blue-50 rounded"
                            title="ערוך"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(price)}
                            className="text-green-600 hover:text-green-800 p-1 hover:bg-green-50 rounded"
                            title="שכפל"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(price.id)}
                            className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded"
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
          </div>
        )}

        {/* Notes Section */}
        {filteredPrices.some(p => p.notes) && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-2">הערות:</h3>
                <div className="space-y-2">
                  {filteredPrices
                    .filter(p => p.notes)
                    .map((price) => (
                      <div key={price.id} className="text-sm text-blue-800">
                        <span className="font-medium">מחירון #{price.id}:</span> {price.notes}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

// Price Form Component
function PriceForm({ subcontractorId, initialData, onSuccess, onCancel }: {
  subcontractorId: number
  initialData?: any
  onSuccess: () => void
  onCancel: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<any[]>([])
  const [formData, setFormData] = useState({
    material_id: initialData?.material_id || '',
    price_per_trip: initialData?.price_per_trip || '',
    price_per_ton: initialData?.price_per_ton || '',
    price_per_m3: initialData?.price_per_m3 || '',
    price_per_km: initialData?.price_per_km || '',
    min_charge: initialData?.min_charge || '',
    valid_from: initialData?.valid_from?.split('T')[0] || new Date().toISOString().split('T')[0],
    valid_to: initialData?.valid_to?.split('T')[0] || '',
    notes: initialData?.notes || ''
  })

  // Load materials
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const response = await materialsApi.getAll()
        setMaterials(response.data)
      } catch (error) {
        console.error('Failed to load materials:', error)
      }
    }
    loadMaterials()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const hasAnyPrice = formData.price_per_trip || formData.price_per_ton || 
                        formData.price_per_m3 || formData.price_per_km
    if (!hasAnyPrice) {
      alert('יש למלא לפחות סוג מחיר אחד')
      return
    }

    try {
      setLoading(true)
      
      // Convert empty strings to null and strings to numbers
      const data = {
        material_id: formData.material_id && formData.material_id !== '' ? parseInt(formData.material_id) : null,
        price_per_trip: formData.price_per_trip ? parseFloat(formData.price_per_trip) : null,
        price_per_ton: formData.price_per_ton ? parseFloat(formData.price_per_ton) : null,
        price_per_m3: formData.price_per_m3 ? parseFloat(formData.price_per_m3) : null,
        price_per_km: formData.price_per_km ? parseFloat(formData.price_per_km) : null,
        min_charge: formData.min_charge ? parseFloat(formData.min_charge) : null,
        valid_from: formData.valid_from,
        valid_to: formData.valid_to || null,
        notes: formData.notes || null
      }

      if (initialData) {
        // Update existing
        await subcontractorsApi.updatePriceList(subcontractorId, initialData.id, data as any)
        alert('המחירון עודכן בהצלחה')
      } else {
        // Create new
        await subcontractorsApi.createPriceList(subcontractorId, data as any)
        alert('המחירון נוסף בהצלחה')
      }
      
      onSuccess()
    } catch (error: any) {
      console.error('Failed to save price:', error)
      alert(error.response?.data?.detail || 'שגיאה בשמירת מחירון')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Material Selection */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-purple-900 mb-2">
          🧱 חומר (אופציונלי - השאר ריק להחיל על כל החומרים)
        </label>
        <select
          value={formData.material_id}
          onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
          className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
        >
          <option value="">-- כל החומרים --</option>
          {materials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name} ({material.billing_unit})
            </option>
          ))}
        </select>
        <p className="text-xs text-purple-700 mt-2">
          💡 אם תבחר חומר ספציפי, המחיר יחול רק לחומר זה. אחרת, המחיר יחול על כל החומרים.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מחיר לנסיעה (₪)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price_per_trip}
            onChange={(e) => setFormData({ ...formData, price_per_trip: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="80.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מחיר לטון (₪)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price_per_ton}
            onChange={(e) => setFormData({ ...formData, price_per_ton: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="50.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מחיר למ״ק (₪)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price_per_m3}
            onChange={(e) => setFormData({ ...formData, price_per_m3: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="45.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מחיר לק״מ (₪)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price_per_km}
            onChange={(e) => setFormData({ ...formData, price_per_km: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="2.50"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            מינימום חיוב (₪)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.min_charge}
            onChange={(e) => setFormData({ ...formData, min_charge: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תוקף מתאריך <span className="text-red-600">*</span>
          </label>
          <input
            type="date"
            required
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            תוקף עד תאריך (אופציונלי)
          </label>
          <input
            type="date"
            value={formData.valid_to}
            onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">השאר ריק למחירון ללא תאריך סיום</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          הערות (אופציונלי)
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          placeholder="הערות נוספות על מחירון זה..."
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>שומר...</span>
            </>
          ) : (
            <>
              <DollarSign className="w-4 h-4" />
              <span>{initialData ? 'עדכן מחירון' : 'שמור מחירון'}</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 font-medium"
        >
          ביטול
        </button>
      </div>
    </form>
  )
}
