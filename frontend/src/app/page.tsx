'use client'

import Link from 'next/link'
import { 
  Truck, 
  Calendar, 
  FileText, 
  BarChart3, 
  Shield, 
  Smartphone,
  CheckCircle2,
  ArrowLeft,
  Zap,
  Globe2
} from 'lucide-react'
import Logo from '@/components/ui/Logo'
import Footer from '@/components/layout/Footer'
import { useState } from 'react'

export default function HomePage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const features = [
    {
      icon: Calendar,
      title: 'תכנון ושיבוץ חכם',
      description: 'לוח שיבוץ מתקדם עם Drag & Drop, אופטימיזציה אוטומטית של מסלולים וניהול זמינות'
    },
    {
      icon: Smartphone,
      title: 'אפליקציית נהגים',
      description: 'עדכוני סטטוס בזמן אמת, חתימות דיגיטליות, העלאת תמונות ועבודה במצב Offline'
    },
    {
      icon: FileText,
      title: 'ניהול מסמכים חכם',
      description: 'תעודות משלוח דיגיטליות, תעודות שקילה, סריקת OCR וארכיון ענן מאובטח'
    },
    {
      icon: BarChart3,
      title: 'דוחות ואנליטיקה',
      description: 'דוחות רווחיות, ניתוח ביצועים, מעקב גבייה ו-KPI מתקדמים בזמן אמת'
    },
    {
      icon: Shield,
      title: 'אבטחה מקסימלית',
      description: 'הצפנה מלאה, גיבויים אוטומטיים, Audit Log מלא ועמידה בתקני אבטחת מידע'
    },
    {
      icon: Zap,
      title: 'אוטומציה מלאה',
      description: 'חישוב מחיר אוטומטי, הפקת חשבוניות, התראות חכמות ושילוב מערכות חיצוניות'
    }
  ]

  const pricingPlans = [
    {
      name: 'Starter',
      nameHe: 'בסיסי',
      description: 'לחברות קטנות עד 5 משאיות',
      monthlyPrice: 990,
      yearlyPrice: 9900,
      features: [
        'עד 5 משאיות ו-10 נהגים',
        'ניהול נסיעות ותעודות משלוח',
        'אפליקציית נהגים בסיסית',
        'דוחות סטנדרטיים',
        'תמיכה בדוא"ל',
        'אחסון 10GB'
      ],
      popular: false,
      color: 'blue'
    },
    {
      name: 'Professional',
      nameHe: 'מקצועי',
      description: 'לחברות בינוניות עד 20 משאיות',
      monthlyPrice: 2490,
      yearlyPrice: 24900,
      features: [
        'עד 20 משאיות ו-40 נהגים',
        'כל התכונות מהתוכנית הבסיסית',
        'אופטימיזציה אוטומטית של מסלולים',
        'דוחות מתקדמים + אנליטיקה',
        'שילוב WhatsApp ו-SMS',
        'תמיכה טלפונית',
        'אחסון 50GB',
        'API לשילוב מערכות'
      ],
      popular: true,
      color: 'indigo'
    },
    {
      name: 'Enterprise',
      nameHe: 'ארגוני',
      description: 'לחברות גדולות - ללא הגבלה',
      monthlyPrice: null,
      yearlyPrice: null,
      features: [
        'משאיות ונהגים ללא הגבלה',
        'כל התכונות מהתוכנית המקצועית',
        'מנהל חשבון ייעודי',
        'התאמות אישיות',
        'הדרכה אישית לצוות',
        'תמיכה 24/7',
        'אחסון ללא הגבלה',
        'SLA 99.9%',
        'גיבויים מרובי אזורים'
      ],
      popular: false,
      color: 'purple'
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Logo size="sm" />
            <div className="flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-blue-600 transition-colors">
                תכונות
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-blue-600 transition-colors">
                מחירים
              </a>
              <Link 
                href="/login" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                כניסה למערכת
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto text-center max-w-5xl">
          <Logo size="xl" className="justify-center mb-8" />
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            המערכת המקצועית לניהול
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              הובלות עפר וחומרי בניין
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            TruckFlow - הפתרון המלא לניהול צי, שיבוץ נהגים, תיעוד דיגיטלי וחיוב אוטומטי.
            <br />
            חסכו זמן, הגדילו רווחיות ושפרו שירות בקליק אחד.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              התחל עכשיו בחינם
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <a
              href="#pricing"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl border-2 border-blue-600 hover:bg-blue-50 transition-all"
            >
              צפה במחירים
            </a>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            ✓ ניסיון חינם ל-30 יום  ✓ ללא כרטיס אשראי  ✓ ביטול בכל עת
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-100">חברות פעילות</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-blue-100">משאיות מנוהלות</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">100K+</div>
              <div className="text-blue-100">נסיעות בחודש</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">זמינות המערכת</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              כל מה שצריך לניהול מושלם
            </h2>
            <p className="text-xl text-gray-600">
              פתרון מקיף לכל היבטי ניהול ההובלות
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              תוכניות מחירים שמתאימות לכל עסק
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              בחרו את התוכנית המושלמת עבורכם
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600'
                }`}
              >
                חיוב חודשי
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  billingCycle === 'yearly'
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-600'
                }`}
              >
                חיוב שנתי
                <span className="text-green-600 text-sm mr-2">חסכו 17%</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all hover:scale-105 ${
                  plan.popular
                    ? 'border-indigo-500 shadow-indigo-200'
                    : 'border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      המומלץ ביותר
                    </span>
                  </div>
                )}
                
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {plan.nameHe}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    {plan.monthlyPrice ? (
                      <>
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-bold text-gray-900">
                            {billingCycle === 'monthly' 
                              ? `₪${plan.monthlyPrice.toLocaleString()}`
                              : `₪${Math.floor(plan.yearlyPrice! / 12).toLocaleString()}`
                            }
                          </span>
                          <span className="text-gray-600">/חודש</span>
                        </div>
                        {billingCycle === 'yearly' && (
                          <p className="text-sm text-green-600 mt-2">
                            ₪{plan.yearlyPrice!.toLocaleString()} לשנה (חסכון של ₪{(plan.monthlyPrice * 12 - plan.yearlyPrice!).toLocaleString()})
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="text-3xl font-bold text-gray-900">
                        הצעת מחיר אישית
                      </div>
                    )}
                  </div>

                  <Link
                    href="/login"
                    className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all mb-6 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:shadow-lg'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    {plan.monthlyPrice ? 'התחל ניסיון חינם' : 'צור קשר'}
                  </Link>

                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <CheckCircle2 className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                          plan.popular ? 'text-indigo-600' : 'text-blue-600'
                        }`} />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-gray-600 mt-12">
            כל התוכניות כוללות: ✓ ניסיון חינם ל-30 יום ✓ תמיכה בעברית ✓ אבטחה מלאה ✓ גיבויים יומיים
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            מוכנים להתחיל?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            הצטרפו למאות חברות הובלות שכבר משתמשות ב-TruckFlow
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 text-lg font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-xl"
          >
            התחל ניסיון חינם עכשיו
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-blue-100">
            אין צורך בכרטיס אשראי • התקנה מיידית • תמיכה מלאה בעברית
          </p>
        </div>
      </section>

      {/* Footer */}
      <Footer variant="landing" />
    </div>
  )
}
