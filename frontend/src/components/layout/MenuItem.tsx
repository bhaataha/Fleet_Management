'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface MenuItemProps {
  href: string
  icon?: string
  children: React.ReactNode
  badge?: number
  onClick?: () => void
}

export function MenuItem({ href, icon, children, badge, onClick }: MenuItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center justify-between px-4 py-2 mr-2 rounded-lg transition-colors text-sm",
        isActive
          ? "bg-blue-50 text-blue-600 font-medium shadow-sm"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <span className="text-lg" role="img" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full min-w-[20px] text-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  )
}
