'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Se monta en el layout de la app autenticada.
 * Si el usuario ya concedió permiso de notificaciones pero no tiene
 * suscripción guardada, la crea silenciosamente.
 * Si el permiso es 'default', lo solicita una sola vez (5s después de cargar).
 */
export function PushAutoSubscribe({ userId }: { userId: string }) {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      !('PushManager' in window) ||
      !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    ) return

    async function trySubscribe() {
      try {
        await navigator.serviceWorker.register('/sw.js')
        const reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
        ])

        // Si ya hay suscripción activa, solo guardarla por si acaso
        const existing = await reg.pushManager.getSubscription()
        if (existing) {
          await saveSubscription(existing)
          return
        }

        // Si el permiso ya fue concedido, suscribir directamente
        if (Notification.permission === 'granted') {
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
              process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
          })
          await saveSubscription(sub)
          return
        }

        // Si el permiso es 'default', pedir después de 5 segundos
        if (Notification.permission === 'default') {
          setTimeout(async () => {
            const perm = await Notification.requestPermission()
            if (perm !== 'granted') return
            const sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
              ),
            })
            await saveSubscription(sub)
          }, 5000)
        }
      } catch {
        // silencioso — no bloquea la app
      }
    }

    async function saveSubscription(sub: PushSubscription) {
      const supabase = createClient()
      const json = sub.toJSON()
      const keys = json.keys as { p256dh: string; auth: string }
      await supabase.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: json.endpoint!,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: 'endpoint' })
    }

    trySubscribe()
  }, [userId])

  return null
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const arr = Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
  return arr.buffer.slice(arr.byteOffset, arr.byteOffset + arr.byteLength)
}
