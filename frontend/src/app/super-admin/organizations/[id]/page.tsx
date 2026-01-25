'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { superAdminApi } from '@/lib/api'

interface OrganizationData {
  id: string
  name: string
  slug: string
  display_name: string
  contact_name: string
  contact_email: string
  contact_phone: string
  vat_id: string
  address: string
  city: string
  postal_code: string
  country: string
  plan_type: string
  max_trucks: number
  max_drivers: number
  max_customers: number
  max_storage_gb: number
  trial_ends_at?: string
  status: string
  timezone: string
  locale: string
  currency: string
}

export default function EditOrganizationPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [org, setOrg] = useState<OrganizationData | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    vat_id: '',
    address: '',
    city: '',
    postal_code: '',
    country: 'IL',
    plan_type: 'trial',
    max_trucks: 10,
    max_drivers: 10,
    max_customers: 50,
    max_storage_gb: 10,
    trial_ends_at: '',
    timezone: 'Asia/Jerusalem',
    locale: 'he',
    currency: 'ILS'
  })

  // Check if user is super admin
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
    if (!user.is_super_admin) {
      router.push('/dashboard')
      return
    }
  }, [user, router])

  // Load organization data
  useEffect(() => {
    if (user?.is_super_admin && params.id) {
      loadOrganization()
    }
  }, [user, params.id])

  const loadOrganization = async () => {
    try {
      setLoading(true)
      const response = await superAdminApi.getOrganization(params.id as string)
      const orgData = response.data
      setOrg(orgData)
      
      // Populate form
      setFormData({
        name: orgData.name || '',
        display_name: orgData.display_name || '',
        contact_name: orgData.contact_name || '',
        contact_email: orgData.contact_email || '',
        contact_phone: orgData.contact_phone || '',
        vat_id: orgData.vat_id || '',
        address: orgData.address || '',
        city: orgData.city || '',
        postal_code: orgData.postal_code || '',
        country: orgData.country || 'IL',
        plan_type: orgData.plan_type || 'trial',
        max_trucks: orgData.max_trucks || 10,
        max_drivers: orgData.max_drivers || 10,
        max_customers: orgData.max_customers || 50,
        max_storage_gb: orgData.max_storage_gb || 10,
        trial_ends_at: orgData.trial_ends_at ? new Date(orgData.trial_ends_at).toISOString().split('T')[0] : '',
        timezone: orgData.timezone || 'Asia/Jerusalem',
        locale: orgData.locale || 'he',
        currency: orgData.currency || 'ILS'
      })
    } catch (error: any) {
      console.error('Failed to load organization:', error)
      alert('שגיאה בטעינת נתוני הארגון: ' + (error.response?.data?.detail || error.message))
      router.push('/super-admin')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      const updateData: any = {
        name: formData.name,
        display_name: formData.display_name,
        contact_name: formData.contact_name,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone || null,
        vat_id: formData.vat_id || null,
        plan_type: formData.plan_type,
        max_trucks: formData.max_trucks,
        max_drivers: formData.max_drivers,
      }
      
      // Add trial_ends_at only if it's set
      if (formData.trial_ends_at) {
        updateData.trial_ends_at = formData.trial_ends_at
      }
      
      await superAdminApi.updateOrganization(params.id as string, updateData)
      alert('הארגון עודכן בהצלחה!')
      router.push('/super-admin')
    } catch (error: any) {
      console.error('Failed to update organization:', error)
      alert('שגיאה בעדכון הארגון: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  if (!user?.is_super_admin) {
    return null
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/super-admin')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            חזרה לניהול ארגונים
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">עריכת ארגון</h1>
          <p className="mt-2 text-sm text-gray-600">
            {org?.slug} ({org?.id})
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטים בסיסיים</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">שם הארגון *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">שם תצוגה</label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder={formData.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Slug (לא ניתן לשינוי)</label>
                <input
                  type="text"
                  disabled
                  value={org?.slug}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">מזהה ארגון (UUID)</label>
                <input
                  type="text"
                  disabled
                  value={org?.id}
                  className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm text-xs"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">פרטי קשר</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">שם איש קשר *</label>
                <input
                  type="text"
                  required
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">מספר טלפון</label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="050-1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">אימייל *</label>
                <input
                  type="email"
                  required
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ח.פ / ע.מ</label>
                <input
                  type="text"
                  value={formData.vat_id}
                  onChange={(e) => setFormData({ ...formData, vat_id: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Plan & Limits */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">תוכנית ומגבלות</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">סוג תוכנית</label>
                <select
                  value={formData.plan_type}
                  onChange={(e) => setFormData({ ...formData, plan_type: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="free">חינם</option>
                  <option value="trial">נסיון</option>
                  <option value="basic">בסיסי</option>
                  <option value="professional">מקצועי</option>
                  <option value="enterprise">ארגוני</option>
                </select>
              </div>

              {formData.plan_type === 'trial' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">תפוגת נסיון</label>
                  <input
                    type="date"
                    value={formData.trial_ends_at}
                    onChange={(e) => setFormData({ ...formData, trial_ends_at: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">מקסימום משאיות</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_trucks}
                  onChange={(e) => setFormData({ ...formData, max_trucks: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">מקסימום נהגים</label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_drivers}
                  onChange={(e) => setFormData({ ...formData, max_drivers: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Statistics */}
          {org && (
            <div className="border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">סטטיסטיקות</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">משאיות</div>
                  <div className="text-2xl font-bold text-gray-900">{org.total_trucks}</div>
                  <div className="text-xs text-gray-500">מתוך {org.max_trucks}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">נהגים</div>
                  <div className="text-2xl font-bold text-gray-900">{org.total_drivers}</div>
                  <div className="text-xs text-gray-500">מתוך {org.max_drivers}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">נסיעות הושלמו</div>
                  <div className="text-2xl font-bold text-gray-900">{org.total_jobs_completed}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">סטטוס</div>
                  <div className="text-lg font-semibold">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      org.status === 'active' ? 'bg-green-100 text-green-800' :
                      org.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {org.status === 'active' ? 'פעיל' : org.status === 'suspended' ? 'מושעה' : 'נסיון'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="border-t pt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.push('/super-admin')}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'שומר...' : 'שמור שינויים'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}
