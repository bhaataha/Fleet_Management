'use client'

import { useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
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
