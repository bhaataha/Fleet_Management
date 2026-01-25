'use client'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  className?: string
}

export default function Logo({ size = 'md', showText = true, className = '' }: LogoProps) {
  const sizes = {
    sm: { icon: 'w-8 h-8', text: 'text-xl' },
    md: { icon: 'w-12 h-12', text: 'text-2xl' },
    lg: { icon: 'w-16 h-16', text: 'text-3xl' },
    xl: { icon: 'w-24 h-24', text: 'text-5xl' }
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon - Truck with dirt/sand wave */}
      <div className={`${sizes[size].icon} relative`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Sand/Dirt waves at bottom */}
          <path
            d="M0 75 Q 15 70, 30 75 T 60 75 T 90 75 T 120 75 L 120 100 L 0 100 Z"
            fill="#D97706"
            opacity="0.3"
          />
          <path
            d="M0 82 Q 12 78, 24 82 T 48 82 T 72 82 T 96 82 L 96 100 L 0 100 Z"
            fill="#D97706"
            opacity="0.5"
          />
          
          {/* Truck body */}
          <rect x="15" y="45" width="35" height="20" rx="2" fill="#2563EB" />
          <rect x="50" y="35" width="35" height="30" rx="3" fill="#1E40AF" />
          
          {/* Truck bed (container) */}
          <path
            d="M 52 35 L 83 35 L 80 45 L 55 45 Z"
            fill="#3B82F6"
            opacity="0.7"
          />
          
          {/* Cabin window */}
          <rect x="18" y="48" width="12" height="10" rx="1" fill="#DBEAFE" />
          
          {/* Wheels */}
          <circle cx="30" cy="68" r="7" fill="#374151" />
          <circle cx="30" cy="68" r="4" fill="#6B7280" />
          <circle cx="70" cy="68" r="7" fill="#374151" />
          <circle cx="70" cy="68" r="4" fill="#6B7280" />
          
          {/* Speed lines */}
          <line x1="5" y1="40" x2="12" y2="40" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
          <line x1="3" y1="50" x2="8" y2="50" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
          <line x1="6" y1="60" x2="13" y2="60" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* Brand Name */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${sizes[size].text} font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent leading-tight`}>
            TruckFlow
          </span>
          <span className="text-xs text-gray-500 font-medium tracking-wider">
            FLEET MANAGEMENT
          </span>
        </div>
      )}
    </div>
  )
}
