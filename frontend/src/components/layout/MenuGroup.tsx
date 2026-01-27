'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface MenuGroupProps {
  icon: string
  label: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function MenuGroup({ 
  icon, 
  label, 
  children, 
  defaultOpen = false 
}: MenuGroupProps) {
  const pathname = usePathname()
  const storageKey = `menu-group-${label}`
  
  // Initialize from localStorage or check if any child is active
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return defaultOpen
    
    // Try to load from localStorage
    const saved = localStorage.getItem(storageKey)
    if (saved !== null) {
      return saved === 'true'
    }
    
    return defaultOpen
  })

  // Auto-open if any child route is active
  useEffect(() => {
    // Check if any child MenuItem is active by inspecting children
    const childElements = Array.isArray(children) ? children : [children]
    const hasActiveChild = childElements.some((child: any) => {
      const href = child?.props?.href
      return href && pathname.startsWith(href)
    })
    
    if (hasActiveChild && !isOpen) {
      setIsOpen(true)
      localStorage.setItem(storageKey, 'true')
    }
  }, [pathname, children, isOpen, storageKey])

  const toggleOpen = useCallback(() => {
    const newState = !isOpen
    setIsOpen(newState)
    localStorage.setItem(storageKey, String(newState))
  }, [isOpen, storageKey])

  return (
    <div className="mb-1">
      <button
        onClick={toggleOpen}
        className="w-full flex items-center justify-between px-4 py-2.5 
                   text-gray-700 hover:bg-gray-100 rounded-lg transition-colors
                   group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" role="img" aria-hidden="true">{icon}</span>
          <span className="font-medium text-sm">{label}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-transform" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-transform" />
        )}
      </button>

      {isOpen && (
        <div className="mr-4 mt-1 space-y-0.5 border-r-2 border-gray-200 pr-2">
          {children}
        </div>
      )}
    </div>
  )
}
