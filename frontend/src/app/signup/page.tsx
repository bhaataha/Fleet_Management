'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Logo from '@/components/ui/Logo'
import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/lib/stores/auth'
import { 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Mail, 
  Phone, 
  Lock, 
  User,
  Truck,
  ArrowLeft
} from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const { t, language } = useI18n()
  const { isAuthenticated } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  const [formData, setFormData] = useState({
    companyName: '',
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fleetSize: '1-5',
    agreeToTerms: false
  })

  const validateForm = () => {
    if (!formData.companyName.trim()) {
      setError('נא להזין שם חברה')
      return false
    }
    if (!formData.fullName.trim()) {
      setError('נא להזין שם מלא')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('נא להזין כתובת אימייל תקינה')
      return false
    }
    if (!formData.phone.trim()) {
      setError('נא להזין מספר טלפון')
      return false
    }
    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות אינן תואמות')
      return false
    }
    if (!formData.agreeToTerms) {
      setError('נא לאשר את תנאי השימוש')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Simulate successful registration
      setSuccess(true)
      
      // Redirect to thank you or login after 2 seconds
      setTimeout(() => {
        router.push('/login?registered=true')
      }, 2000)
      
    } catch (err: any) {
      setError('אירעה שגיאה בהרשמה. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            ההרשמה הושלמה בהצלחה! 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            תודה שנרשמת ל-TruckFlow!
            <br />
            נציג מטעמנו ייצור איתך קשר בקרוב.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              📧 שלחנו לך אימייל אישור ל-{formData.email}
              <br />
              📞 נחזור אליך בטלפון תוך 24 שעות
            </p>
          </div>
          <Link
            href="/login"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            המשך להתחברות
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <Logo size="md" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            התחל ניסיון חינם ל-30 יום
          </h1>
          <p className="text-gray-600">
            ללא כרטיס אשראי • ביטול בכל עת • תמיכה מלאה בעברית
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם החברה *
              </label>
              <div className="relative">
                <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder='לדוגמה: "הובלות הגליל בע״מ"'
                  required
                />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                שם מלא *
              </label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="שם פרטי ושם משפחה"
                  required
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  אימייל *
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="email@company.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  טלפון *
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="050-1234567"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Fleet Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                גודל הצי
              </label>
              <div className="relative">
                <Truck className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  name="fleetSize"
                  value={formData.fleetSize}
                  onChange={handleChange}
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                >
                  <option value="1-5">1-5 משאיות</option>
                  <option value="6-10">6-10 משאיות</option>
                  <option value="11-20">11-20 משאיות</option>
                  <option value="21-50">21-50 משאיות</option>
                  <option value="50+">מעל 50 משאיות</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סיסמה *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="לפחות 6 תווים"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  אישור סיסמה *
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="הזן סיסמה שוב"
                    minLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                required
              />
              <label htmlFor="agreeToTerms" className="text-sm text-gray-700">
                אני מאשר/ת את{' '}
                <a href="#" className="text-blue-600 hover:underline">
                  תנאי השימוש
                </a>{' '}
                ו
                <a href="#" className="text-blue-600 hover:underline">
                  מדיניות הפרטיות
                </a>{' '}
                של TruckFlow
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  התחל ניסיון חינם
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Benefits Reminder */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                ✨ מה כלול בניסיון החינם?
              </p>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✓ גישה מלאה לכל התכונות למשך 30 יום</li>
                <li>✓ תמיכה טכנית בעברית</li>
                <li>✓ הדרכה אישית למערכת</li>
                <li>✓ ללא מחויבות - ביטול בכל עת</li>
              </ul>
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              כבר יש לך חשבון?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                התחבר כאן
              </Link>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 text-center">
          <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>אבטחה מלאה</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>גיבויים יומיים</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>תמיכה 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
