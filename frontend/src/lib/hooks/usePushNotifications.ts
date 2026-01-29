'use client'

import { useEffect } from 'react'
import api from '@/lib/api'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    const run = async () => {
      try {
        const permission = Notification.permission
        if (permission === 'denied') return

        if (permission === 'default') {
          const result = await Notification.requestPermission()
          if (result !== 'granted') return
        }

        const { data } = await api.get('/push/public-key')
        const publicKey = data?.public_key
        if (!publicKey) return

        const reg = await navigator.serviceWorker.ready
        let sub = await reg.pushManager.getSubscription()
        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          })
        }

        const subJson = sub.toJSON()
        if (!subJson?.endpoint || !subJson?.keys?.p256dh || !subJson?.keys?.auth) return

        await api.post('/push/subscribe', {
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth,
          },
          user_agent: navigator.userAgent,
        })
      } catch (error) {
        // Fail silently to avoid blocking app
        console.warn('[Push] subscription failed', error)
      }
    }

    run()
  }, [enabled])
}
