'use client'

import { useState, useEffect } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'

export function useDevice() {
  const [device, setDevice] = useState<DeviceType>('desktop')
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const checkDevice = () => {
      const width = window.innerWidth
      if (width < 768) {
        setDevice('mobile')
      } else if (width < 1024) {
        setDevice('tablet')
      } else {
        setDevice('desktop')
      }
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  return {
    device,
    isMobile: device === 'mobile',
    isTablet: device === 'tablet',
    isDesktop: device === 'desktop',
    isMounted
  }
}
