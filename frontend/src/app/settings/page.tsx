'use client'

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/stores/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import UsersManagementPage from './users/page'
import api, { organizationApi as organizationApiImported } from '@/lib/api'
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database,
  Mail,
  Save,
  Building2,
  Users
} from 'lucide-react'

type SettingsTab = 'profile' | 'organization' | 'email' | 'users' | 'notifications' | 'security' | 'system'

export default function SettingsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [saving, setSaving] = useState(false)
  const [loadingOrg, setLoadingOrg] = useState(false)
  const [logoUploading, setLogoUploading] = useState(false)

  const organizationApi = organizationApiImported || {
    getProfile: () => api.get<any>('/organization'),
    updateProfile: (data: any) => api.patch<any>('/organization', data),
    uploadLogo: (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      return api.post<any>('/organization/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    }
  }

  // Form states
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  })

  const [orgData, setOrgData] = useState({
    display_name: '',
    contact_name: '',
    vat_id: '',
    address: '',
    city: '',
    contact_phone: '',
    contact_email: '',
    logo_url: '',
    message_templates: {
      whatsapp_driver: '',
      whatsapp_customer: '',
      email_subject: '',
      email_body: ''
    },
    smtp: {
      host: '',
      port: '',
      username: '',
      password: '',
      from_email: '',
      from_name: '',
      use_tls: true,
      use_ssl: false
    }
  })

  const defaultTemplates = {
    whatsapp_driver: '🚛 נסיעה #{job_id}\nתאריך: {date}\nמאתר: {from_site}\nלאתר: {to_site}',
    whatsapp_customer: '🚛 נסיעה #{job_id}\nתאריך: {date}\nמאתר: {from_site}\nלאתר: {to_site}',
    email_subject: 'נסיעה #{job_id}',
    email_body: 'שלום {customer_name},\n\nנסיעה #{job_id}\nתאריך: {date}\nמאתר: {from_site}\nלאתר: {to_site}\n\nבברכה,\nTruckFlow'
  }

  const [notificationSettings, setNotificationSettings] = useState({
    emailNewJob: true,
    emailJobCompleted: true,
    emailPaymentReceived: true,
    smsDriverAssigned: false,
    smsJobCompleted: false
  })

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === 'organization' || activeTab === 'email') {
        await organizationApi.updateProfile({
          display_name: orgData.display_name,
          contact_name: orgData.contact_name,
          contact_email: orgData.contact_email,
          contact_phone: orgData.contact_phone,
          vat_id: orgData.vat_id,
          address: orgData.address,
          city: orgData.city,
          logo_url: orgData.logo_url || undefined,
          settings_json: {
            message_templates: orgData.message_templates,
            smtp: {
              host: orgData.smtp.host || undefined,
              port: orgData.smtp.port ? Number(orgData.smtp.port) : undefined,
              username: orgData.smtp.username || undefined,
              password: orgData.smtp.password || undefined,
              from_email: orgData.smtp.from_email || undefined,
              from_name: orgData.smtp.from_name || undefined,
              use_tls: orgData.smtp.use_tls,
              use_ssl: orgData.smtp.use_ssl
            }
          }
        })
        alert('פרטי הארגון נשמרו בהצלחה')
      } else {
        await new Promise(resolve => setTimeout(resolve, 600))
        alert('השינויים נשמרו בהצלחה')
      }
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    const loadOrg = async () => {
      setLoadingOrg(true)
      try {
        const res = await organizationApi.getProfile()
        const org = res.data
        setOrgData({
          display_name: org.display_name || org.name || '',
          contact_name: org.contact_name || '',
          vat_id: org.vat_id || '',
          address: org.address || '',
          city: org.city || '',
          contact_phone: org.contact_phone || '',
          contact_email: org.contact_email || '',
          logo_url: org.logo_url || '',
          message_templates: {
            whatsapp_driver: org.settings_json?.message_templates?.whatsapp_driver || defaultTemplates.whatsapp_driver,
            whatsapp_customer: org.settings_json?.message_templates?.whatsapp_customer || defaultTemplates.whatsapp_customer,
            email_subject: org.settings_json?.message_templates?.email_subject || defaultTemplates.email_subject,
            email_body: org.settings_json?.message_templates?.email_body || defaultTemplates.email_body
          },
          smtp: {
            host: org.settings_json?.smtp?.host || '',
            port: org.settings_json?.smtp?.port?.toString() || '',
            username: org.settings_json?.smtp?.username || '',
            password: org.settings_json?.smtp?.password || '',
            from_email: org.settings_json?.smtp?.from_email || '',
            from_name: org.settings_json?.smtp?.from_name || '',
            use_tls: org.settings_json?.smtp?.use_tls !== false,
            use_ssl: org.settings_json?.smtp?.use_ssl === true
          }
        })
      } catch (error) {
        console.error('Failed to load organization profile:', error)
      } finally {
        setLoadingOrg(false)
      }
    }

    loadOrg()
  }, [])

  const handleLogoUpload = async (file?: File) => {
    if (!file) return
    setLogoUploading(true)
    try {
      const res = await organizationApi.uploadLogo(file)
      setOrgData((prev) => ({
        ...prev,
        logo_url: res.data.logo_url || ''
      }))
      alert('הלוגו הועלה בהצלחה')
    } catch (error) {
      console.error('Failed to upload logo:', error)
      alert('שגיאה בהעלאת לוגו')
    } finally {
      setLogoUploading(false)
    }
  }

  const tabs = [
    { id: 'profile' as SettingsTab, label: 'פרופיל משתמש', icon: User },
    { id: 'organization' as SettingsTab, label: 'פרטי ארגון', icon: Building2 },
    { id: 'email' as SettingsTab, label: 'אימייל', icon: Mail },
    { id: 'users' as SettingsTab, label: 'ניהול משתמשים', icon: Users },
    { id: 'notifications' as SettingsTab, label: 'התראות', icon: Bell },
    { id: 'security' as SettingsTab, label: 'אבטחה', icon: Shield },
    { id: 'system' as SettingsTab, label: 'מערכת', icon: Database }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">הגדרות</h1>
          <p className="text-gray-600 mt-1">ניהול הגדרות המערכת והחשבון</p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow">
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">פרופיל משתמש</h2>
                      <p className="text-gray-600">עדכון פרטים אישיים</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שם מלא
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          אימייל
                        </label>
                        <input
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          טלפון
                        </label>
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="050-1234567"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          תפקיד
                        </label>
                        <input
                          type="text"
                          value={user?.roles?.[0] || 'Admin'}
                          disabled
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Organization Tab */}
                {activeTab === 'organization' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">פרטי ארגון</h2>
                      <p className="text-gray-600">מידע על החברה</p>
                    </div>

                    <div className="space-y-4">
                      {loadingOrg && (
                        <div className="text-sm text-gray-500">טוען פרטי ארגון...</div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שם החברה (לתצוגה)
                        </label>
                        <input
                          type="text"
                          value={orgData.display_name}
                          onChange={(e) => setOrgData({ ...orgData, display_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          איש קשר
                        </label>
                        <input
                          type="text"
                          value={orgData.contact_name}
                          onChange={(e) => setOrgData({ ...orgData, contact_name: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          ח.פ / ע.מ
                        </label>
                        <input
                          type="text"
                          value={orgData.vat_id}
                          onChange={(e) => setOrgData({ ...orgData, vat_id: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          כתובת
                        </label>
                        <input
                          type="text"
                          value={orgData.address}
                          onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          עיר
                        </label>
                        <input
                          type="text"
                          value={orgData.city}
                          onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            טלפון
                          </label>
                          <input
                            type="tel"
                            value={orgData.contact_phone}
                            onChange={(e) => setOrgData({ ...orgData, contact_phone: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            אימייל
                          </label>
                          <input
                            type="email"
                            value={orgData.contact_email}
                            onChange={(e) => setOrgData({ ...orgData, contact_email: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          לוגו חברה
                        </label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleLogoUpload(e.target.files?.[0])}
                            className="block w-full text-sm text-gray-700"
                          />
                          {logoUploading && (
                            <span className="text-sm text-gray-500">מעלה...</span>
                          )}
                        </div>
                        {orgData.logo_url && (
                          <div className="mt-3">
                            <img
                              src={orgData.logo_url}
                              alt="Logo"
                              className="h-14 object-contain"
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* Email Tab */}
                {activeTab === 'email' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">אימייל</h2>
                      <p className="text-gray-600">הגדרות תבניות ושליחה</p>
                    </div>

                    <div className="border-b border-gray-200 pb-4">
                      <h3 className="font-medium text-gray-900 mb-2">תבניות הודעה</h3>
                      <p className="text-sm text-gray-600 mb-4">ניתן להשתמש במשתנים: {`{job_id}`}, {`{date}`}, {`{customer_name}`}, {`{from_site}`}, {`{to_site}`}</p>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp לנהג</label>
                          <textarea
                            rows={3}
                            value={orgData.message_templates.whatsapp_driver}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, whatsapp_driver: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, whatsapp_driver: defaultTemplates.whatsapp_driver }
                            })}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            השתמש בתבנית ברירת מחדל
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp ללקוח</label>
                          <textarea
                            rows={3}
                            value={orgData.message_templates.whatsapp_customer}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, whatsapp_customer: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, whatsapp_customer: defaultTemplates.whatsapp_customer }
                            })}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            השתמש בתבנית ברירת מחדל
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">נושא אימייל</label>
                          <input
                            type="text"
                            value={orgData.message_templates.email_subject}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, email_subject: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, email_subject: defaultTemplates.email_subject }
                            })}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            השתמש בתבנית ברירת מחדל
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">תוכן אימייל</label>
                          <textarea
                            rows={5}
                            value={orgData.message_templates.email_body}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, email_body: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setOrgData({
                              ...orgData,
                              message_templates: { ...orgData.message_templates, email_body: defaultTemplates.email_body }
                            })}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                          >
                            השתמש בתבנית ברירת מחדל
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">SMTP (שליחת אימייל)</h3>
                      <p className="text-sm text-gray-600 mb-4">הגדרות לשליחת אימיילים דרך שרת SMTP</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">שרת SMTP</label>
                          <input
                            type="text"
                            value={orgData.smtp.host}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, host: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="smtp.gmail.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">פורט</label>
                          <input
                            type="number"
                            value={orgData.smtp.port}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, port: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="587"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">שם משתמש</label>
                          <input
                            type="text"
                            value={orgData.smtp.username}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, username: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="user@example.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">סיסמה</label>
                          <input
                            type="password"
                            value={orgData.smtp.password}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, password: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="••••••••"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Email</label>
                          <input
                            type="email"
                            value={orgData.smtp.from_email}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, from_email: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="no-reply@company.com"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">From Name</label>
                          <input
                            type="text"
                            value={orgData.smtp.from_name}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, from_name: e.target.value }
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="TruckFlow"
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-6">
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={orgData.smtp.use_tls}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, use_tls: e.target.checked }
                            })}
                            className="h-4 w-4"
                          />
                          TLS (STARTTLS)
                        </label>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={orgData.smtp.use_ssl}
                            onChange={(e) => setOrgData({
                              ...orgData,
                              smtp: { ...orgData.smtp, use_ssl: e.target.checked }
                            })}
                            className="h-4 w-4"
                          />
                          SSL
                        </label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Users Management Tab */}
                {activeTab === 'users' && (
                  <div>
                    <UsersManagementPage />
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">התראות</h2>
                      <p className="text-gray-600">הגדרות התראות אימייל וSMS</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">התראות אימייל</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'emailNewJob', label: 'נסיעה חדשה נוצרה' },
                            { key: 'emailJobCompleted', label: 'נסיעה הושלמה' },
                            { key: 'emailPaymentReceived', label: 'תשלום התקבל' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                                onChange={(e) => setNotificationSettings({
                                  ...notificationSettings,
                                  [item.key]: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">התראות SMS</h3>
                        <div className="space-y-3">
                          {[
                            { key: 'smsDriverAssigned', label: 'נהג שובץ לנסיעה' },
                            { key: 'smsJobCompleted', label: 'נסיעה הושלמה' }
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                                onChange={(e) => setNotificationSettings({
                                  ...notificationSettings,
                                  [item.key]: e.target.checked
                                })}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-gray-700">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">אבטחה</h2>
                      <p className="text-gray-600">שינוי סיסמה והגדרות אבטחה</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          סיסמה נוכחית
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          סיסמה חדשה
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          אימות סיסמה
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        שנה סיסמה
                      </button>
                    </div>
                  </div>
                )}

                {/* System Tab */}
                {activeTab === 'system' && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">הגדרות מערכת</h2>
                      <p className="text-gray-600">הגדרות כלליות ותצורה</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          שפת המערכת
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="he">עברית</option>
                          <option value="en">English</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          אזור זמן
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="Asia/Jerusalem">ירושלים (GMT+2)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          פורמט תאריך
                        </label>
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                          <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                        </select>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="font-medium text-gray-900 mb-4">מידע מערכת</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">גרסה:</span>
                            <span className="font-medium">1.0.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">עדכון אחרון:</span>
                            <span className="font-medium">25/01/2026</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">סביבה:</span>
                            <span className="font-medium">Production</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'שומר...' : 'שמור שינויים'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
