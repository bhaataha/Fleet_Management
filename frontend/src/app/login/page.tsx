'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'
import { useI18n } from '@/lib/i18n'
import { authApi } from '@/lib/api'
import Logo from '@/components/ui/Logo'
import { AlertCircle, Globe, Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth, isAuthenticated, user } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // If already authenticated, redirect to correct dashboard
    if (isAuthenticated && user) {
      const route = getPostLoginRoute(user)
      console.log('🔄 Already authenticated, redirecting to:', route, { user })
      router.push(route)
    }
  }, [isAuthenticated, router, user])

  const getPostLoginRoute = (user: any) => {
    if (!user) return '/dashboard'
    
    // Super Admin -> Super Admin panel
    if (user.is_super_admin) return '/super-admin'
    
    // Driver Detection - Check multiple conditions:
    // 1. org_role is "driver" or "DRIVER"
    // 2. roles array includes "DRIVER"
    // 3. driver_id exists (most reliable - means user has driver profile)
    const isDriverRole = user.org_role?.toLowerCase() === 'driver'
    const hasDriverRole = Array.isArray(user.roles) && user.roles.some((role: string) => role.toUpperCase() === 'DRIVER')
    const hasDriverProfile = user.driver_id !== null && user.driver_id !== undefined
    
    // If ANY driver indicator exists -> Mobile App
    if (isDriverRole || hasDriverRole || hasDriverProfile) {
      console.log('🚚 Driver detected, redirecting to mobile app:', {
        isDriverRole,
        hasDriverRole,
        hasDriverProfile,
        driver_id: user.driver_id,
        org_role: user.org_role
      })
      return '/mobile/home'
    }
    
    // Default -> Admin Dashboard
    return '/dashboard'
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !password) {
      setError('נא למלא את כל השדות')
      setLoading(false)
      return
    }

    if (!email.includes('@')) {
      setError('נא להזין כתובת אימייל תקינה')
      setLoading(false)
      return
    }

    try {
      const response = await authApi.login({ email, password })
      const { access_token, user } = response.data

      if (!user || !access_token) {
        throw new Error('תגובה לא תקינה מהשרת')
      }

      console.log('✅ Login successful:', {
        name: user.name,
        org_role: user.org_role,
        driver_id: user.driver_id,
        is_super_admin: user.is_super_admin
      })

      setAuth(user, access_token)
      const route = getPostLoginRoute(user)
      console.log('🚀 Redirecting to:', route)
      router.push(route)
    } catch (err: any) {
      console.error('Login error:', err.response?.status, err.response?.data)
      const detail = err.response?.data?.detail
      
      if (detail) {
        if (Array.isArray(detail)) {
          const messages = detail.map((item: any) => item?.msg).filter(Boolean)
          setError(messages.join(', ') || 'שגיאה בפרטי התחברות')
        } else if (detail === 'Incorrect credentials') {
          setError('אימייל או סיסמה שגויים')
        } else if (typeof detail === 'string' && detail.includes('suspended')) {
          setError('הארגון מושעה - אנא פנה לתמיכה')
        } else if (detail === 'User account is inactive') {
          setError('חשבון המשתמש אינו פעיל')
        } else if (typeof detail === 'string') {
          setError(detail)
        } else {
          setError('שגיאה בהתחברות')
        }
      } else {
        setError('שגיאה בהתחברות - אנא נסה שוב')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLanguageChange = (lang: 'he' | 'en' | 'ar') => {
    setLanguage(lang)
    setLanguageMenuOpen(false)
  }

  const getLanguageLabel = () => {
    switch (language) {
      case 'he': return 'עברית'
      case 'en': return 'English'
      case 'ar': return 'العربية'
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-pulse">
          <Logo size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 px-4">
      {/* Decorative background */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-indigo-300/40 blur-3xl" />

      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full">
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <div className="relative">
              <button
                onClick={() => setLanguageMenuOpen(!languageMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm bg-white/90 rounded-full shadow-sm hover:shadow-md transition-shadow border border-white/60"
              >
                <Globe className="w-4 h-4" />
                {getLanguageLabel()}
              </button>
              {languageMenuOpen && (
                <div className="absolute left-0 mt-2 w-36 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => handleLanguageChange('he')}
                    className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-100 ${language === 'he' ? 'bg-blue-50 font-semibold text-blue-600' : ''}`}
                  >
                    עברית
                  </button>
                  <button
                    onClick={() => handleLanguageChange('en')}
                    className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-100 ${language === 'en' ? 'bg-blue-50 font-semibold text-blue-600' : ''}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => handleLanguageChange('ar')}
                    className={`w-full text-center px-4 py-2 text-sm hover:bg-gray-100 ${language === 'ar' ? 'bg-blue-50 font-semibold text-blue-600' : ''}`}
                  >
                    العربية
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-8 sm:p-10 border border-white/60">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo size="lg" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">כניסה למערכת</h1>
              <p className="text-gray-600">{t('auth.welcome')}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    disabled={loading}
                    className="w-full pl-4 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    dir="ltr"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {t('auth.logging_in')}
                  </span>
                ) : (
                  t('auth.login')
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              TruckFlow &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
