'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  ClipboardList, 
  Camera, 
  User,
  Bell,
  CheckCircle
} from 'lucide-react'

const navigation = [
  { name: 'ראשי', href: '/mobile/home', icon: Home },
  { name: 'משימות', href: '/mobile/jobs', icon: ClipboardList },
  { name: 'צילום', href: '/mobile/camera', icon: Camera },
  { name: 'התראות', href: '/mobile/alerts', icon: Bell },
  { name: 'פרופיל', href: '/mobile/profile', icon: User },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16 px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                min-w-[60px] h-14 rounded-lg
                transition-all duration-200
                ${isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-6 h-6 mb-1 ${isActive ? 'stroke-[2.5]' : 'stroke-[2]'}`} />
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
