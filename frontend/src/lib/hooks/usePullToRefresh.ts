'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number
  resistance?: number
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  resistance = 3 
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [isPulling, setIsPulling] = useState(false)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const startY = useRef(0)
  const currentY = useRef(0)
  const isDragging = useRef(false)

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only start if we're at the top of the page
    if (window.scrollY > 0) {
      console.log('[PullToRefresh] Ignoring touch - not at top of page, scrollY:', window.scrollY)
      return
    }
    
    console.log('[PullToRefresh] Touch start detected at:', e.touches[0].clientY)
    startY.current = e.touches[0].clientY
    isDragging.current = true
    setIsPulling(false)
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging.current || window.scrollY > 0) return
    
    currentY.current = e.touches[0].clientY
    const deltaY = currentY.current - startY.current
    
    if (deltaY > 0) {
      // Prevent default scrolling when pulling down at top
      e.preventDefault()
      
      // Apply resistance
      const distance = Math.min(deltaY / resistance, threshold * 1.5)
      setPullDistance(distance)
      setIsPulling(distance > 10)
      
      if (distance > 20) { // Only log when there's significant movement
        console.log('[PullToRefresh] Pulling distance:', distance.toFixed(2), 'threshold:', threshold)
      }
    }
  }, [threshold, resistance])

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return
    
    console.log('[PullToRefresh] Touch end - distance:', pullDistance, 'threshold:', threshold)
    isDragging.current = false
    
    if (pullDistance > threshold && !isRefreshing) {
      console.log('[PullToRefresh] Triggering refresh...')
      setIsRefreshing(true)
      setIsPulling(false)
      
      try {
        await onRefresh()
      } catch (error) {
        console.error('Refresh failed:', error)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Animate back to 0
      setPullDistance(0)
      setIsPulling(false)
    }
  }, [pullDistance, threshold, isRefreshing, onRefresh])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Add event listeners with passive: false to allow preventDefault
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])

  const refreshIndicatorStyle = {
    transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
    opacity: Math.min(pullDistance / threshold, 1),
    transition: isDragging.current ? 'none' : 'transform 0.3s ease-out, opacity 0.3s ease-out'
  }

  const containerStyle = {
    transform: `translateY(${isPulling || isRefreshing ? Math.min(pullDistance, threshold) : 0}px)`,
    transition: isDragging.current ? 'none' : 'transform 0.3s ease-out'
  }

  return {
    containerRef,
    isRefreshing,
    isPulling,
    pullDistance,
    refreshIndicatorStyle,
    containerStyle,
    shouldShowIndicator: isPulling || isRefreshing
  }
}