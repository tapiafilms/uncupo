'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeReserva } from '@/lib/hooks/useRealtimeViaje'
import { useRealtimeViaje } from '@/lib/hooks/useRealtimeViaje'
import { formatTime, formatPrice, cn } from '@/lib/utils'
import type { PassengerState, TripState } from '@/lib/types'
import { MapPin, Clock, Car, User, CheckCircle, AlertCircle } from 'lucide-react'

// Passenger state machine
const PASSENGER_STEPS: { key: PassengerState; label: string; emoji: string; desc: string }[] = [
  { key: 'reservado',   label: 'Reservado',     emoji: '📋', desc: 'Esperando que el chofer confirme' },
  { key: 'en_camino',   label: 'En camino',     emoji: '🚶', desc: 'Vas hacia el punto de encuentro' },
  { key: 'en_el_punto', label: 'En el punto',   emoji: '📍', desc: 'Estás en el punto de encuentro' },
  { key: 'en_viaje',    label: 'En viaje',      emoji: '🚗', desc: 'Viajando hacia el destino' },
  { key: 'llego',       label: 'Llegaste',      emoji: '🏁', desc: 'Llegaste al destino' },
]

const NEXT_PASSENGER_STATE: Partial<Record<PassengerState, { state: PassengerState; label: string }>> = {
  reservado:   { state: 'en_camino',   label: '🚶 Salí hacia el punto' },
  en_camino:   { state: 'en_el_punto', label: '📍 Llegué al punto de encuentro' },
  en_el_punto: { state: 'en_viaje',    label: '🚗 Subí al auto' },
  en_viaje:    { state: 'llego',       label: '🏁 Llegué al destino' },
}

const TRIP_STATE_MESSAGES: Partial<Record<TripState, { color: string; msg: string }>> = {
  publicado:  { color: 'text-info',    msg: '⏳ Esperando que el chofer confirme el viaje' },
  confirmado: { color: 'text-success', msg: '✅ Viaje confirmado — prepárate para salir' },
  en_camino:  { color: 'text-warning', msg: '🚗 El chofer está en camino al punto de encuentro' },
  en_destino: { color: 'text-brand',   msg: '📍 El chofer llegó al destino' },
  finalizado: { color: 'text-success', msg: '🏁 Viaje finalizado' },
  cancelado:  { color: 'text-danger',  msg: '❌ El viaje fue cancelado' },
}

interface Props {
  reservaId: string
  reservaInicial: any
  pasajeroId: string
}

export function PassengerTripView({ reservaId, reservaInicial, pasajeroId }: Props) {
  const supabase = createClient()
  const { reserva, loading: loadingReserva } = useRealtimeReserva(reservaId)
  const currentReserva = reserva ?? reservaInicial

  const viajeId = reservaInicial?.viaje_id ?? reservaInicial?.viaje?.id
  const { viaje } = useRealtimeViaje(viajeId)
  const currentViaje = viaje ?? reservaInicial?.viaje

  const [advancing, setAdvancing] = useState(false)

  const estadoPasajero = (currentReserva?.estado_pasajero ?? 'reservado') as PassengerState
  const estadoViaje    = (currentViaje?.estado ?? 'publicado') as TripState
  const currentStepIdx = PASSENGER_STEPS.findIndex(s => s.key === estadoPasajero)
  const nextStep       = NEXT_PASSENGER_STATE[estadoPasajero]
  const tripMsg        = TRIP_STATE_MESSAGES[estadoViaje]
  const pagado         = currentReserva?.pago_confirmado
  const chofer         = reservaInicial?.viaje?.chofer

  async function advancePassengerState() {
    if (!nextStep) return
    setAdvancing(true)
    await supabase
      .from('reservas')
      .update({ estado_pasajero: nextStep.state })
      .eq('id', reservaId)
    setAdvancing(false)
  }

  if (!currentViaje) return null

  // Cancelled trip
  if (estadoViaje === 'cancelado') {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-5xl mb-4">❌</span>
        <p className="text-danger font-bold text-lg">Viaje cancelado</p>
        <p className="text-ink-muted text-sm mt-1 mb-6">El chofer canceló este viaje</p>
        <a href="/home" className="btn-primary">Buscar otro viaje</a>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="pt-2 mb-5">
        <h1 className="text-2xl font-bold text-ink-primary">Mi Reserva</h1>
        <p className="text-ink-secondary text-sm mt-1">
          {currentViaje?.origen} → {currentViaje?.destino} · {formatTime(currentViaje?.fecha_hora)}
        </p>
      </div>

      {/* Trip status banner */}
      {tripMsg && (
        <div className={cn(
          'card p-3 mb-4 border-l-4 animate-fade-in',
          (estadoViaje as string) === 'en_camino'  ? 'border-warning' :
          (estadoViaje as string) === 'confirmado' ? 'border-success' :
          (estadoViaje as string) === 'cancelado'  ? 'border-danger'  : 'border-brand'
        )}>
          <p className={cn('text-sm font-medium', tripMsg.color)}>{tripMsg.msg}</p>
        </div>
      )}

      {/* My state progress */}
      <div className="card p-4 mb-4">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">Tu estado</p>
        <div className="space-y-3">
          {PASSENGER_STEPS.map((step, i) => {
            const done    = i < currentStepIdx
            const current = i === currentStepIdx
            const future  = i > currentStepIdx

            return (
              <div key={step.key} className="flex items-center gap-3">
                {/* Node */}
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all',
                  done    ? 'bg-brand text-white' :
                  current ? 'bg-brand text-white ring-4 ring-brand/30 animate-pulse-dot' :
                  'bg-surface-overlay text-ink-muted border border-surface-border'
                )}>
                  {done ? '✓' : step.emoji}
                </div>

                {/* Label */}
                <div className="flex-1">
                  <p className={cn(
                    'text-sm font-semibold',
                    done ? 'text-brand' : current ? 'text-ink-primary' : 'text-ink-muted'
                  )}>
                    {step.label}
                  </p>
                  {current && (
                    <p className="text-xs text-ink-secondary mt-0.5">{step.desc}</p>
                  )}
                </div>

                {current && <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />}
              </div>
            )
          })}
        </div>
      </div>

      {/* Driver info */}
      {chofer && (
        <div className="card p-4 mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Chofer</p>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand/20 flex items-center justify-center text-lg font-bold text-brand">
              {chofer?.nombre?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-ink-primary">{chofer?.nombre}</p>
              {chofer?.calificacion_promedio > 0 && (
                <p className="text-xs text-warning mt-0.5">★ {Number(chofer.calificacion_promedio).toFixed(1)}</p>
              )}
            </div>
            <div className="ml-auto text-right">
              <p className="text-brand font-bold text-lg">{formatPrice(currentViaje?.precio_cupo)}</p>
              <p className="text-xs text-ink-muted">al llegar · efectivo</p>
            </div>
          </div>
          {reservaInicial?.viaje?.vehiculo && (
            <div className="mt-3 pt-3 border-t border-surface-border flex items-center gap-2">
              <Car size={13} className="text-ink-muted" />
              <p className="text-xs text-ink-secondary">
                {reservaInicial.viaje.vehiculo.marca} {reservaInicial.viaje.vehiculo.modelo} · {reservaInicial.viaje.vehiculo.color} · {reservaInicial.viaje.vehiculo.patente}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pago confirmado */}
      {pagado && (
        <div className="bg-success/10 border border-success/30 rounded-2xl p-5 text-center mb-4">
          <CheckCircle size={32} className="text-success mx-auto mb-2" />
          <p className="text-success font-bold text-lg">¡Pago confirmado!</p>
          <p className="text-success/70 text-sm mt-1">
            El chofer confirmó el pago de {formatPrice(currentViaje?.precio_cupo)}
          </p>
          <a href="/home" className="btn-secondary w-full mt-4 block text-center text-sm">
            Volver al inicio
          </a>
        </div>
      )}

      {/* CTA — advance passenger state */}
      {!pagado && nextStep && (estadoViaje as string) !== 'finalizado' && (estadoViaje as string) !== 'cancelado' && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 max-w-md mx-auto">
          <button
            onClick={advancePassengerState}
            disabled={advancing}
            className="btn-primary w-full py-4 text-base font-bold shadow-glow"
          >
            {advancing ? 'Actualizando…' : nextStep.label}
          </button>
          <p className="text-center text-xs text-ink-muted mt-2">
            El chofer verá tu estado en tiempo real
          </p>
        </div>
      )}
    </div>
  )
}
