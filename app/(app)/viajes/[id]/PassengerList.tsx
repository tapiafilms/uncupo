'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { PassengerState } from '@/lib/types'
import { CheckCircle, Circle, MessageCircle } from 'lucide-react'
import Link from 'next/link'

const ESTADOS: { key: PassengerState; label: string; emoji: string }[] = [
  { key: 'reservado',       label: 'Reservado',       emoji: '📋' },
  { key: 'en_camino',       label: 'En camino',        emoji: '🚶' },
  { key: 'en_el_punto',     label: 'En el punto',      emoji: '📍' },
  { key: 'en_viaje',        label: 'En viaje',         emoji: '🚗' },
  { key: 'llego',           label: 'Llegó',            emoji: '🏁' },
  { key: 'pago_confirmado', label: 'Pago confirmado',  emoji: '💰' },
]

interface Pasajero {
  id: string
  nombre: string
  telefono: string
  estado: string
}

export function PassengerList({
  pasajeros,
  viajeId,
}: {
  pasajeros: Pasajero[]
  viajeId: string
}) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  async function confirmPago(reservaId: string) {
    setLoading(reservaId)
    await supabase
      .from('reservas')
      .update({ estado_pasajero: 'pago_confirmado', pago_confirmado: true })
      .eq('id', reservaId)
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="card mb-6">
      <div className="px-4 pt-4 pb-2 border-b border-surface-border">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          Pasajeros ({pasajeros.length})
        </p>
      </div>
      <div className="divide-y divide-surface-border">
        {pasajeros.map((p) => {
          const estadoIdx = ESTADOS.findIndex((e) => e.key === p.estado)
          const estadoInfo = ESTADOS.find((e) => e.key === p.estado)
          const pagado = p.estado === 'pago_confirmado'

          return (
            <div key={p.id} className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center text-sm font-bold text-brand shrink-0">
                  {p.nombre[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink-primary text-sm truncate">{p.nombre}</p>
                  <p className="text-xs text-ink-muted">
                    {estadoInfo?.emoji} {estadoInfo?.label ?? p.estado}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/chat/${p.id}`}
                    className="w-8 h-8 rounded-xl bg-surface-overlay border border-surface-border
                               flex items-center justify-center text-brand active:scale-95 transition-all"
                  >
                    <MessageCircle size={14} />
                  </Link>
                  {p.estado === 'llego' && !pagado && (
                    <button
                      onClick={() => confirmPago(p.id)}
                      disabled={loading === p.id}
                      className="bg-success/10 border border-success/30 text-success text-xs font-semibold rounded-xl px-3 py-2 active:scale-95 transition-all"
                    >
                      {loading === p.id ? '…' : '💰 Confirmar pago'}
                    </button>
                  )}
                  {pagado && (
                    <span className="flex items-center gap-1 text-xs text-success font-medium">
                      <CheckCircle size={14} />
                      Pagado
                    </span>
                  )}
                </div>
              </div>

              {/* Progress steps */}
              <div className="flex items-center gap-0.5 mt-3">
                {ESTADOS.slice(0, 5).map((e, i) => (
                  <div key={e.key} className="flex items-center flex-1">
                    <div className={cn(
                      'w-full h-1 rounded-full transition-all',
                      i <= estadoIdx - 1 ? 'bg-brand' : 'bg-surface-overlay'
                    )} />
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0 transition-all',
                      i <= estadoIdx ? 'bg-brand' : 'bg-surface-overlay border border-surface-border'
                    )} />
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
