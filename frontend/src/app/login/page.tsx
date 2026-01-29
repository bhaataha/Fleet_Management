'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/stores/auth'
import { useI18n } from '@/lib/i18n'
import { authApi, phoneAuthApi } from '@/lib/api'
import Logo from '@/components/ui/Logo'
import { AlertCircle, Globe, Smartphone, CheckCircle, Mail, Lock, Eye, EyeOff } from 'lucide-react'

type AuthStep = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth, isAuthenticated, user } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [orgSlug] = useState('default-org') // Default to default org
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false)
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone')
  const [authStep, setAuthStep] = useState<AuthStep>('phone')
  const [otpSent, setOtpSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const passwordLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN === 'true'
  const showDemoCredentials = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDENTIALS === 'true'
  const [usePassword, setUsePassword] = useState(passwordLoginEnabled)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [showEmailPassword, setShowEmailPassword] = useState(false)

  useEffect(() => {
    setMounted(true)

    const method = searchParams?.get('method')
    if (method === 'email') {
      setLoginMethod('email')
    }
    
    // If already authenticated, redirect to correct dashboard
    if (isAuthenticated && user) {
      const route = getPostLoginRoute(user)
      console.log('🔄 Already authenticated, redirecting to:', route, { user })
      router.push(route)
    }
  }, [isAuthenticated, router, searchParams, user])

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

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const formatPhone = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')
    // Add dashes for display: 0507771111 -> 050-777-1111
    if (digits.length >= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`
    }
    return digits
  }

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // If using password mode, login directly
      if (usePassword) {
        const response = await phoneAuthApi.loginWithPassword({ 
          phone, 
          password,
          org_slug: orgSlug 
        })
        
        const { access_token, user } = response.data
        
        if (!user || !access_token) {
          throw new Error('Invalid response from server')
        }
        
        console.log('✅ Password login successful:', {
          name: user.name,
          org_role: user.org_role,
          driver_id: user.driver_id,
          roles: user.roles
        })
        
        setAuth(user, access_token)
        const route = getPostLoginRoute(user)
        console.log('🚀 Redirecting to:', route)
        router.push(route)
      } else {
        // OTP mode
        await phoneAuthApi.sendOTP({ phone, org_slug: orgSlug })
        setAuthStep('otp')
        setOtpSent(true)
        setCountdown(60) // 60 seconds until resend allowed
      }
    } catch (err: any) {
      console.error('Login error:', err.response?.status, err.response?.data)
      const detail = err.response?.data?.detail
      if (err.response?.status === 401) {
        setError('סיסמה או טלפון שגויים')
      } else if (detail) {
        if (Array.isArray(detail)) {
          const messages = detail.map((item: any) => item?.msg).filter(Boolean)
          setError(messages.join(', ') || 'שגיאה בהתחברות')
        } else if (typeof detail === 'string') {
          setError(detail)
        } else {
          setError('שגיאה בהתחברות')
        }
      } else {
        setError(usePassword ? 'שגיאה בהתחברות' : 'שגיאה בשליחת קוד אימות')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await phoneAuthApi.verifyOTP({ 
        phone, 
        otp_code: otpCode, 
        org_slug: orgSlug 
      })
      
      const { access_token, user } = response.data
      
      if (!user || !access_token) {
        throw new Error('Invalid response from server')
      }
      
      console.log('✅ OTP verification successful:', {
        name: user.name,
        org_role: user.org_role,
        driver_id: user.driver_id,
        roles: user.roles
      })
      
      setAuth(user, access_token)
      const route = getPostLoginRoute(user)
      console.log('🚀 Redirecting to:', route)
      router.push(route)
    } catch (err: any) {
      console.error('OTP verification error:', err.response?.status, err.response?.data)
      const detail = err.response?.data?.detail
      if (err.response?.status === 401) {
        setError('קוד אימות שגוי או פג תוקף')
      } else if (detail) {
        if (Array.isArray(detail)) {
          const messages = detail.map((item: any) => item?.msg).filter(Boolean)
          setError(messages.join(', ') || 'קוד אימות שגוי או פג תוקף')
        } else if (typeof detail === 'string') {
          setError(detail)
        } else {
          setError('קוד אימות שגוי או פג תוקף')
        }
      } else {
        setError('קוד אימות שגוי או פג תוקף')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    setError('')
    setLoading(true)

    try {
      await phoneAuthApi.resendOTP({ phone, org_slug: orgSlug })
      setCountdown(60)
    } catch (err: any) {
      setError('שגיאה בשליחה חוזרת של קוד אימות')
    } finally {
      setLoading(false)
    }
  }

  const handleBackToPhone = () => {
    setAuthStep('phone')
    setOtpCode('')
    setError('')
    setOtpSent(false)
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!email || !emailPassword) {
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
      const response = await authApi.login({ email, password: emailPassword })
      const { access_token, user } = response.data

      if (!user || !access_token) {
        throw new Error('תגובה לא תקינה מהשרת')
      }

      setAuth(user, access_token)
      router.push(getPostLoginRoute(user))
    } catch (err: any) {
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

  const handleLoginMethodChange = (method: 'phone' | 'email') => {
    setLoginMethod(method)
    setError('')
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
        <div className="max-w-lg w-full">
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

          {/* Login Method Tabs */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              type="button"
              onClick={() => handleLoginMethodChange('phone')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                loginMethod === 'phone'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              📱 טלפון
            </button>
            <button
              type="button"
              onClick={() => handleLoginMethodChange('email')}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border ${
                loginMethod === 'email'
                  ? 'bg-blue-600 text-white border-blue-600 shadow'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              ✉️ אימייל
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Login Form */}
          {loginMethod === 'phone' && authStep === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              {/* Toggle Password/OTP Mode */}
              {passwordLoginEnabled && (
                <div className="flex items-center justify-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setUsePassword(true)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      usePassword 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🔑 סיסמה
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsePassword(false)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      !usePassword 
                        ? 'bg-blue-600 text-white shadow' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    📱 קוד SMS
                  </button>
                </div>
              )}

              {/* Phone Field */}
              <div>
                <label 
                  htmlFor="phone" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Smartphone className="inline w-4 h-4 ml-2" />
                  מספר טלפון
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-left"
                  placeholder="0507771111"
                  disabled={loading}
                  dir="ltr"
                />
                {phone && !usePassword && (
                  <p className="text-sm text-gray-500 mt-1">
                    יישלח ל: {formatPhone(phone)}
                  </p>
                )}
              </div>

              {/* Password Field (only in password mode) */}
              {passwordLoginEnabled && usePassword && (
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    🔒 סיסמה
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="הזן סיסמה"
                    disabled={loading}
                  />
                  {showDemoCredentials && (
                    <p className="text-xs text-gray-500 mt-1">
                      💡 למשתמשי דמו: demo123
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !phone || (usePassword && !password)}
                className="w-full bg-gradient-to-l from-blue-600 to-indigo-600 text-white py-3.5 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'מתחבר...' : (usePassword ? '🔓 התחבר' : '📨 שלח קוד אימות')}
              </button>
            </form>
          )}

          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail className="inline w-4 h-4 ml-2" />
                  כתובת אימייל
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pr-10 pl-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="your-email@company.com"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="emailPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline w-4 h-4 ml-2" />
                  סיסמה
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="emailPassword"
                    type={showEmailPassword ? 'text' : 'password'}
                    required
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="block w-full pr-10 pl-10 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right"
                    placeholder="הזן את הסיסמה שלך"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 left-0 pl-3 flex items-center"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                  >
                    {showEmailPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-l from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'מתחבר...' : 'התחבר'}
              </button>
            </form>
          )}

          {loginMethod === 'phone' && authStep !== 'phone' && (
            <form onSubmit={handleVerifyOTP} className="space-y-6 mt-6">
              {/* OTP Success Message */}
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-green-800 font-medium">
                    קוד אימות נשלח ל-{formatPhone(phone)}
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    הקוד תקף למשך 5 דקות
                  </p>
                </div>
              </div>

              {/* OTP Field */}
              <div>
                <label 
                  htmlFor="otpCode" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  קוד אימות (6 ספרות)
                </label>
                <input
                  id="otpCode"
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest font-mono"
                  placeholder="123456"
                  disabled={loading}
                  dir="ltr"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otpCode.length !== 6}
                  className="w-full bg-gradient-to-l from-emerald-600 to-green-600 text-white py-3.5 px-4 rounded-xl hover:from-emerald-700 hover:to-green-700 focus:ring-4 focus:ring-green-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'מאמת...' : 'אימות והתחברות'}
                </button>
                
                {/* Resend OTP */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || loading}
                    className="text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `שלח שוב (${countdown}s)` : 'שלח קוד חדש'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    חזור לטלפון
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Demo Credentials */}
          {showDemoCredentials && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-2 text-center">משתמשי דמו:</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>מנהל:</span>
                  <span dir="ltr">050-123-4567</span>
                </div>
                <div className="flex justify-between">
                  <span>סדרן:</span>
                  <span dir="ltr">050-123-4568</span>
                </div>
                <div className="flex justify-between">
                  <span>הנהלת חשבונות:</span>
                  <span dir="ltr">050-123-4569</span>
                </div>
                <div className="flex justify-between">
                  <span>נהג:</span>
                  <span dir="ltr">050-777-1111</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          TruckFlow © 2026
        </p>
      </div>
    </div>
    </div>
  )
}
