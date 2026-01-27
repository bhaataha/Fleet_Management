'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  FileText,
  DollarSign,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'דשבורד', href: '/dashboard', icon: LayoutDashboard },
  { name: 'לוח תכנון', href: '/dispatch', icon: FileText },
  { name: 'נסיעות', href: '/jobs', icon: MapPin },
  { name: 'צי משאיות', href: '/fleet', icon: Truck, children: [
    { name: 'משאיות', href: '/trucks' },
    { name: 'נהגים', href: '/drivers' },
    { name: 'קבלני משנה', href: '/subcontractors' },
  ]},
  { name: 'לקוחות ואתרים', href: '/customers', icon: Users, children: [
    { name: 'לקוחות', href: '/customers' },
    { name: 'אתרים', href: '/sites' },
  ]},
  { name: 'כספים', href: '/billing', icon: DollarSign, children: [
    { name: 'חשבוניות', href: '/statements' },
    { name: 'תשלומים', href: '/billing' },
    { name: 'הוצאות', href: '/expenses' },
    { name: 'מחירונים', href: '/pricing' },
  ]},
  { name: 'דוחות', href: '/reports', icon: FileText },
  { name: 'הגדרות', href: '/settings', icon: Settings },
]

export default function DesktopSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(true)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (name: string) => {
    setExpandedItems(prev => 
      prev.includes(name) 
        ? prev.filter(item => item !== name)
        : [...prev, name]
    )
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-lg border border-gray-200"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 right-0 h-screen bg-white border-l border-gray-200
          transition-transform duration-300 z-40
          ${isOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          w-64 overflow-y-auto
        `}
      >
        {/* Logo */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-center">
            <Truck className="w-8 h-8 text-blue-600 ml-2" />
            <h1 className="text-xl font-bold text-gray-900">TruckFlow</h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedItems.includes(item.name)
            const Icon = item.icon

            return (
              <div key={item.name}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.name)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 font-semibold' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 ml-3" />
                      <span>{item.name}</span>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={`
                      flex items-center px-4 py-3 rounded-lg
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 text-blue-600 font-semibold' 
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 ml-3" />
                    <span>{item.name}</span>
                  </Link>
                )}

                {/* Sub-menu */}
                {hasChildren && isExpanded && (
                  <div className="mr-4 mt-1 space-y-1">
                    {item.children?.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Link
                          key={child.name}
                          href={child.href}
                          className={`
                            block px-4 py-2 pr-12 rounded-lg text-sm
                            transition-all duration-200
                            ${isChildActive
                              ? 'bg-blue-50 text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50'
                            }
                          `}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Logout */}
          <button
            onClick={() => {
              localStorage.removeItem('access_token')
              localStorage.removeItem('user')
              window.location.href = '/login'
            }}
            className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-8"
          >
            <LogOut className="w-5 h-5 ml-3" />
            <span>התנתק</span>
          </button>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
