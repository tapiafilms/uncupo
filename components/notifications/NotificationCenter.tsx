'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DbNotificacion } from '@/lib/types'

export function NotificationCenter({ userId }: { userId: string }) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<DbNotificacion[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetchNotifs()

    const channel = supabase
      .channel(`notifs-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificaciones',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setNotifs((prev) => [payload.new as DbNotificacion, ...prev])
        setUnread((n) => n + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  async function fetchNotifs() {
    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('creado_en', { ascending: false })
      .limit(20)
    setNotifs((data as DbNotificacion[]) ?? [])
    setUnread((data ?? []).filter((n: any) => !n.leido).length)
  }

  async function markAllRead() {
    await supabase.from('notificaciones').update({ leido: true }).eq('user_id', userId).eq('leido', false)
    setNotifs((prev) => prev.map((n) => ({ ...n, leido: true })))
    setUnread(0)
  }

  async function markRead(id: string) {
    await supabase.from('notificaciones').update({ leido: true }).eq('id', id)
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, leido: true } : n))
    setUnread((n) => Math.max(0, n - 1))
  }

  const TIPO_EMOJI: Record<string, string> = {
    nueva_reserva:       '🎫',
    reserva_cancelada:   '❌',
    viaje_iniciado:      '🚗',
    viaje_finalizado:    '🏁',
    pago_confirmado:     '💰',
    nueva_alerta:        '🔔',
    calificacion_recibida: '⭐',
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
        className="relative w-10 h-10 rounded-full bg-surface-overlay flex items-center justify-center"
      >
        <Bell size={18} className="text-ink-secondary" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand flex items-center justify-center text-[9px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-surface-raised border border-surface-border rounded-2xl shadow-card overflow-hidden z-50 animate-slide-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
            <p className="font-semibold text-ink-primary text-sm">Notificaciones</p>
            <button onClick={() => setOpen(false)} className="text-ink-muted">
              <X size={16} />
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-surface-border">
            {notifs.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-ink-muted text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={cn(
                    'px-4 py-3 cursor-pointer hover:bg-surface-overlay transition-colors',
                    !n.leido && 'bg-brand/5'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-lg shrink-0 mt-0.5">
                      {TIPO_EMOJI[n.tipo] ?? '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-ink-primary leading-tight">{n.titulo}</p>
                      <p className="text-xs text-ink-muted mt-0.5 leading-tight">{n.mensaje}</p>
                      <p className="text-[10px] text-ink-muted/60 mt-1">
                        {new Date(n.creado_en).toLocaleString('es-CL', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                    </div>
                    {!n.leido && (
                      <span className="w-2 h-2 rounded-full bg-brand shrink-0 mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
