'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { subcontractorsApi } from '@/lib/api'
import Link from 'next/link'

export default function SubcontractorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const subcontractorId = parseInt(params.id as string)

  const [subcontractor, setSubcontractor] = useState<any>(null)
  const [prices, setPrices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    fetchData()
  }, [subcontractorId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [subRes, pricesRes] = await Promise.all([
        subcontractorsApi.get(subcontractorId),
        subcontractorsApi.getPriceLists(subcontractorId)
      ])
      setSubcontractor(subRes.data)
      setPrices(pricesRes.data)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'שגיאה בטעינה')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !subcontractor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || 'לא נמצא קבלן זה'}
          </div>
          <Link href="/subcontractors" className="mt-4 inline-block text-blue-600 hover:underline">
            ← חזור לקבלנים
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/subcontractors" className="text-blue-600 hover:underline">
            ← חזור לקבלנים
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-3">{subcontractor.name}</h1>
          <p className="text-gray-500 mt-1">{subcontractor.company_name}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'details'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📋 פרטים
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'prices'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💰 מחירונים ({prices.length})
          </button>
          <Link
            href={`/subcontractors/${subcontractorId}/prices`}
            className="mr-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
          >
            📊 דף מחירון מלא
          </Link>
        </div>

        {/* Content */}
        {activeTab === 'details' && (
          <SubcontractorDetailsTab subcontractor={subcontractor} onUpdate={fetchData} />
        )}

        {activeTab === 'prices' && (
          <SubcontractorPricesTab
            subcontractorId={subcontractorId}
            prices={prices}
            onPricesUpdated={fetchData}
          />
        )}
      </div>
    </div>
  )
}

// Details Tab
function SubcontractorDetailsTab({ subcontractor, onUpdate }: { subcontractor: any; onUpdate: () => void }) {
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState(subcontractor)
  const [loading, setLoading] = useState(false)

  const handleSave = async (e: any) => {
    e.preventDefault()
    try {
      setLoading(true)
      await subcontractorsApi.update(subcontractor.id, formData)
      alert('הקבלן עודכן בהצלחה')
      onUpdate()
      setEditing(false)
    } catch (err: any) {
      console.error('Save error:', err)
      alert(err.response?.data?.detail || 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  if (editing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם חברה</label>
              <input
                type="text"
                value={formData.company_name || ''}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">טלפון</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">דוא״ל</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מספר משאית</label>
              <input
                type="text"
                value={formData.truck_plate_number || ''}
                onChange={(e) => setFormData({ ...formData, truck_plate_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="12-345-67"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">מס׳ ח.פ</label>
              <input
                type="text"
                value={formData.vat_id || ''}
                onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">תנאי תשלום</label>
              <input
                type="text"
                value={formData.payment_terms || ''}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="שוטף+30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">אמצעי תשלום</label>
              <input
                type="text"
                value={formData.payment_method || ''}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="העברה בנקאית"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">הערות</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg h-24"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '⏳ שומר...' : '💾 שמור'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="bg-gray-300 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-400"
            >
              ❌ ביטול
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">שם</p>
            <p className="text-lg font-medium">{subcontractor.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">שם חברה</p>
            <p className="text-lg font-medium">{subcontractor.company_name || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">מספר משאית</p>
            <p className="text-lg font-medium text-blue-600">{subcontractor.truck_plate_number || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">טלפון</p>
            <p className="text-lg font-medium">{subcontractor.phone}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">מס׳ ח.פ</p>
            <p className="text-lg font-medium">{subcontractor.vat_id || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">דוא״ל</p>
            <p className="text-lg font-medium">{subcontractor.email || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">תנאי תשלום</p>
            <p className="text-lg font-medium">{subcontractor.payment_terms}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">אמצעי תשלום</p>
            <p className="text-lg font-medium">{subcontractor.payment_method || '-'}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">סטטוס</p>
            <p className="text-lg font-medium">
              {subcontractor.is_active ? '✅ פעיל' : '❌ לא פעיל'}
            </p>
          </div>
        </div>

        {subcontractor.notes && (
          <div>
            <p className="text-sm text-gray-600 mb-2">הערות</p>
            <p className="text-gray-900">{subcontractor.notes}</p>
          </div>
        )}
      </div>

      <button
        onClick={() => setEditing(true)}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
      >
        ✏️ ערוך פרטים
      </button>
    </div>
  )
}

// Prices Tab
function SubcontractorPricesTab({ subcontractorId, prices, onPricesUpdated }: { subcontractorId: number; prices: any[]; onPricesUpdated: () => void }) {
  const [showForm, setShowForm] = useState(false)

  return (
    <div>
      {showForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <PriceForm
            subcontractorId={subcontractorId}
            onSuccess={() => {
              setShowForm(false)
              onPricesUpdated()
            }}
          />
        </div>
      )}

      <button
        onClick={() => setShowForm(!showForm)}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
      >
        ➕ מחירון חדש
      </button>

      {prices.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          אין מחירונים עדיין
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {prices.map((price) => (
            <div key={price.id} className="bg-white rounded-lg shadow-md p-4">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                {price.price_per_trip && (
                  <div>
                    <p className="text-gray-600">נסיעה</p>
                    <p className="font-medium">{price.price_per_trip}₪</p>
                  </div>
                )}
                {price.price_per_ton && (
                  <div>
                    <p className="text-gray-600">/טון</p>
                    <p className="font-medium">{price.price_per_ton}₪</p>
                  </div>
                )}
                {price.price_per_m3 && (
                  <div>
                    <p className="text-gray-600">/מ״ק</p>
                    <p className="font-medium">{price.price_per_m3}₪</p>
                  </div>
                )}
                {price.min_charge && (
                  <div>
                    <p className="text-gray-600">מינימום</p>
                    <p className="font-medium">{price.min_charge}₪</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-600">מ</p>
                  <p className="font-medium">{new Date(price.valid_from).toLocaleDateString('he-IL')}</p>
                </div>
                <div>
                  <p className="text-gray-600">עד</p>
                  <p className="font-medium">
                    {price.valid_to ? new Date(price.valid_to).toLocaleDateString('he-IL') : '∞'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Price Form
function PriceForm({ subcontractorId, onSuccess }: { subcontractorId: number; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    price_per_trip: '',
    price_per_ton: '',
    price_per_m3: '',
    price_per_km: '',
    min_charge: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_to: '',
    notes: ''
  })

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      setLoading(true)
      // Convert empty strings to null
      const data = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, v === '' ? null : v])
      )
      await subcontractorsApi.createPriceList(subcontractorId, data)
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'שגיאה בשמירה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר נסיעה</label>
          <input
            type="number"
            step="0.01"
            value={formData.price_per_trip}
            onChange={(e) => setFormData({ ...formData, price_per_trip: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר לטון</label>
          <input
            type="number"
            step="0.01"
            value={formData.price_per_ton}
            onChange={(e) => setFormData({ ...formData, price_per_ton: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר למ״ק</label>
          <input
            type="number"
            step="0.01"
            value={formData.price_per_m3}
            onChange={(e) => setFormData({ ...formData, price_per_m3: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מחיר לק״מ</label>
          <input
            type="number"
            step="0.01"
            value={formData.price_per_km}
            onChange={(e) => setFormData({ ...formData, price_per_km: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מינימום חיוב</label>
          <input
            type="number"
            step="0.01"
            value={formData.min_charge}
            onChange={(e) => setFormData({ ...formData, min_charge: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">תוקף מ *</label>
          <input
            type="date"
            required
            value={formData.valid_from}
            onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? '⏳ שומר...' : '💾 שמור'}
        </button>
      </div>
    </form>
  )
}
