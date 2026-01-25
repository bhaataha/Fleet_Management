'use client'

import Link from 'next/link'
import Logo from '@/components/ui/Logo'
import { Globe2, Mail, Phone, MapPin } from 'lucide-react'

interface FooterProps {
  variant?: 'landing' | 'app'
}

export default function Footer({ variant = 'landing' }: FooterProps) {
  const currentYear = new Date().getFullYear()

  if (variant === 'app') {
    // Minimal footer for inside the app
    return (
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Logo size="sm" />
            </div>
            
            <div className="text-center md:text-left">
              <p className="text-gray-500">© {currentYear} TruckFlow. כל הזכויות שמורות.</p>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-1">
              <p className="text-xs text-gray-400">פותח ונבנה על ידי</p>
              <a 
                href="https://itninja.co.il" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors flex items-center gap-1"
              >
                <span>נינגה תקשורת והנדסה</span>
                <Globe2 className="w-3 h-3" />
              </a>
              <a 
                href="tel:0547748823" 
                className="text-xs text-gray-500 hover:text-blue-600 transition-colors flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                054-774-8823
              </a>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  // Full landing page footer
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Main Footer Content */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <Logo size="sm" className="mb-4 brightness-0 invert" />
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              הפתרון המקצועי והמתקדם ביותר
              לניהול הובלות עפר וחומרי בניין.
              טכנולוגיה מתקדמת, ממשק ידידותי,
              תמיכה מלאה בעברית.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                </svg>
              </a>
              <a href="#" className="w-8 h-8 bg-gray-700 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">קישורים מהירים</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  תכונות המערכת
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  מחירים ותוכניות
                </a>
              </li>
              <li>
                <Link href="/login" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  כניסה למערכת
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  מדריך למשתמש
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">תמיכה ושירות</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="mailto:support@truckflow.co.il" className="hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  support@truckflow.co.il
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  שאלות נפוצות
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  מדיניות פרטיות
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors flex items-center gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                  תנאי שימוש
                </a>
              </li>
            </ul>
          </div>

          {/* Developer Info */}
          <div>
            <h3 className="font-semibold text-white mb-4 text-lg">פותח על ידי</h3>
            <div className="space-y-3">
              <a 
                href="https://itninja.co.il" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-4 rounded-lg hover:shadow-lg transition-all">
                  <p className="font-bold text-lg mb-2">נינגה תקשורת והנדסה בע״מ</p>
                  <p className="text-sm text-blue-100 mb-3">פתרונות תוכנה מתקדמים</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-blue-50">
                      <Globe2 className="w-4 h-4" />
                      <span className="group-hover:underline">itninja.co.il</span>
                    </div>
                    <a 
                      href="tel:0547748823" 
                      className="flex items-center gap-2 text-blue-50 hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-4 h-4" />
                      054-774-8823
                    </a>
                    <div className="flex items-center gap-2 text-blue-50">
                      <MapPin className="w-4 h-4" />
                      <span className="text-xs">ישראל</span>
                    </div>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-gray-400">
              © {currentYear} TruckFlow by IT Ninja. כל הזכויות שמורות.
            </p>
            <div className="flex gap-6 text-gray-400">
              <a href="#" className="hover:text-white transition-colors">תנאי שימוש</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">מדיניות פרטיות</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition-colors">נגישות</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
