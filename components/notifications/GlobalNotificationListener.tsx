'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Escucha nuevas notificaciones del usuario en tiempo real.
 * - Reproduce un sonido (funciona con la pestaña activa o en segundo plano)
 * - Muestra una notificación nativa del browser si tiene permiso
 *   (aparece como popup del OS incluso con la pestaña minimizada)
 */
export function GlobalNotificationListener({ userId }: { userId: string }) {
  const supabase = createClient()
  const audioCtxRef = useRef<AudioContext | null>(null)

  function playPing() {
    try {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'

      // Dos tonos: ding-dong
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15)
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.5)
    } catch { /* silencioso */ }
  }

  function showBrowserNotification(titulo: string, mensaje: string) {
    if (typeof window === 'undefined' || !('Notification' in window)) return
    if (Notification.permission !== 'granted') return
    // No mostrar si la pestaña está activa y visible
    if (document.visibilityState === 'visible') return
    try {
      new Notification(titulo, {
        body: mensaje,
        icon: '/icon-192.png',
        tag: 'uncupo-notif',
      })
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    const channel = supabase
      .channel(`global-notifs-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificaciones',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as { titulo: string; mensaje: string }
          playPing()
          showBrowserNotification(n.titulo, n.mensaje)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  return null
}
