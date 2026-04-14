'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, cn } from '@/lib/utils'
import type { TripState, PassengerState } from '@/lib/types'

const ESTADO_PASAJERO_LABELS: Record<PassengerState, string> = {
  reservado:       '✅ Reservado',
  en_camino:       '🚶 En camino al punto',
  en_el_punto:     '📍 En el punto',
  en_viaje:        '🚗 En viaje',
  llego:           '🏁 Llegó',
  pago_confirmado: '💰 Pago confirmado',
}

interface ReserveButtonProps {
  viajeId: string
  pasajeroId: string
  cuposDisponibles: number
  precio: number
  estado: TripState
  yaReservado: boolean
  reservaId?: string
  estadoPasajero?: PassengerState
}

export function ReserveButton({
  viajeId,
  pasajeroId,
  cuposDisponibles,
  precio,
  estado,
  yaReservado,
  reservaId,
  estadoPasajero,
}: ReserveButtonProps) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  const disponible = ['publicado', 'confirmado'].includes(estado) && cuposDisponibles > 0

  async function handleReservar() {
    setLoading(true)
    setError(null)

    const { error: err } = await supabase
      .from('reservas')
      .insert({
        viaje_id: viajeId,
        pasajero_id: pasajeroId,
        estado_pasajero: 'reservado',
        pago_confirmado: false,
      })

    setLoading(false)
    setShowConfirm(false)

    if (err) {
      if (err.message.includes('horario')) {
        setError('Ya tienes otro viaje reservado en ese horario.')
      } else if (err.code === '23505') {
        setError('Ya tienes una reserva en este viaje.')
      } else {
        setError('No se pudo reservar. Intenta nuevamente.')
      }
      return
    }

    router.refresh()
  }

  async function handleCancelar() {
    if (!reservaId) return
    setLoading(true)
    setError(null)

    const { error: err } = await supabase
      .from('reservas')
      .delete()
      .eq('id', reservaId)

    setLoading(false)
    setShowCancel(false)

    if (err) {
      setError('No se pudo cancelar. Intenta nuevamente.')
      return
    }

    router.refresh()
  }

  if (estado === 'cancelado') {
    return (
      <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 text-center">
        <p className="text-danger font-semibold">Viaje cancelado</p>
      </div>
    )
  }

  if (estado === 'finalizado') {
    return (
      <div className="bg-surface-overlay border border-surface-border rounded-2xl p-4 text-center">
        <p className="text-ink-muted font-semibold">Viaje finalizado</p>
      </div>
    )
  }

  // Already reserved
  if (yaReservado && estadoPasajero) {
    return (
      <div className="space-y-2">
        <div className="bg-success/10 border border-success/30 rounded-2xl p-4 text-center">
          <p className="text-success font-bold text-sm">
            {ESTADO_PASAJERO_LABELS[estadoPasajero]}
          </p>
          <p className="text-success/60 text-xs mt-0.5">
            Pagas {formatPrice(precio)} al chofer al llegar
          </p>
        </div>

        {['reservado', 'en_camino', 'en_el_punto'].includes(estadoPasajero) && (
          <>
            {showCancel ? (
              <div className="card p-4 space-y-3">
                <p className="text-sm text-ink-primary font-medium text-center">
                  ¿Seguro que quieres cancelar?
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowCancel(false)}
                    className="btn-secondary text-sm py-2.5"
                  >
                    Mantener
                  </button>
                  <button
                    onClick={handleCancelar}
                    disabled={loading}
                    className="bg-danger hover:bg-danger/80 text-white font-semibold rounded-xl py-2.5 text-sm transition-all"
                  >
                    {loading ? 'Cancelando…' : 'Cancelar reserva'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCancel(true)}
                className="btn-ghost w-full text-danger/70 text-sm"
              >
                Cancelar reserva
              </button>
            )}
          </>
        )}

        {error && <p className="text-danger text-xs text-center">{error}</p>}
      </div>
    )
  }

  // Not available
  if (!disponible) {
    return (
      <div className="bg-surface-overlay border border-surface-border rounded-2xl p-4 text-center">
        <p className="text-ink-muted font-semibold text-sm">
          {cuposDisponibles === 0 ? 'Sin cupos disponibles' : 'Reservas no disponibles'}
        </p>
      </div>
    )
  }

  // Available to reserve
  return (
    <div className="space-y-2">
      {showConfirm ? (
        <div className="card p-4 space-y-3 animate-slide-up">
          <p className="text-sm font-semibold text-ink-primary text-center">
            Confirmar reserva
          </p>
          <div className="bg-surface-overlay rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-brand">{formatPrice(precio)}</p>
            <p className="text-xs text-ink-muted mt-0.5">Pagas al chofer al llegar · Efectivo</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="btn-secondary text-sm py-3"
            >
              Volver
            </button>
            <button
              onClick={handleReservar}
              disabled={loading}
              className="btn-primary text-sm py-3"
            >
              {loading ? 'Reservando…' : 'Confirmar'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className={cn(
            'btn-primary w-full py-4 text-base font-bold',
            'shadow-glow'
          )}
        >
          Reservar cupo · {formatPrice(precio)}
        </button>
      )}

      {error && (
        <p className="text-danger text-xs text-center animate-fade-in">{error}</p>
      )}
    </div>
  )
}
