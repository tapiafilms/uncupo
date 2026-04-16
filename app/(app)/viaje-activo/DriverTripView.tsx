'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRealtimeViaje } from '@/lib/hooks/useRealtimeViaje'
import { formatTime, formatPrice, cn } from '@/lib/utils'
import type { TripState, PassengerState, DbViaje, DbReserva } from '@/lib/types'
import { Users, MapPin, ChevronRight, CheckCircle, Clock, AlertCircle, MessageCircle } from 'lucide-react'
import Link from 'next/link'

// Trip state machine — valid next states for driver
const NEXT_TRIP_STATE: Partial<Record<TripState, { state: TripState; label: string; color: string }>> = {
  publicado:  { state: 'confirmado', label: '✅ Confirmar viaje',    color: 'bg-success' },
  confirmado: { state: 'en_camino',  label: '🚗 Iniciar viaje',      color: 'bg-brand' },
  en_camino:  { state: 'en_destino', label: '📍 Llegué al destino',  color: 'bg-brand' },
  en_destino: { state: 'finalizado', label: '🏁 Finalizar viaje',    color: 'bg-success' },
}

const TRIP_STATE_LABEL: Record<TripState, string> = {
  publicado:  'Publicado',
  confirmado: 'Confirmado',
  en_camino:  'En camino',
  en_destino: 'En destino',
  finalizado: 'Finalizado',
  cancelado:  'Cancelado',
}

const TRIP_STATE_STEPS: TripState[] = ['publicado', 'confirmado', 'en_camino', 'en_destino', 'finalizado']

const PASSENGER_STATE_EMOJI: Record<PassengerState, string> = {
  reservado:       '📋',
  en_camino:       '🚶',
  en_el_punto:     '📍',
  en_viaje:        '🚗',
  llego:           '🏁',
  pago_confirmado: '💰',
}

const PASSENGER_STATE_LABEL: Record<PassengerState, string> = {
  reservado:       'Reservado',
  en_camino:       'En camino',
  en_el_punto:     'En el punto',
  en_viaje:        'En viaje',
  llego:           'Llegó',
  pago_confirmado: 'Pago confirmado',
}

interface PassengerWithProfile extends DbReserva {
  pasajero: { id: string; nombre: string; telefono: string; calificacion_promedio: number }
}

interface Props {
  viajeId: string
  viajeInicial: DbViaje
  reservasIniciales: PassengerWithProfile[]
  choferId: string
}

export function DriverTripView({ viajeId, viajeInicial, reservasIniciales, choferId }: Props) {
  const supabase = createClient()
  const { viaje, reservas, loading } = useRealtimeViaje(viajeId)
  const [advancing, setAdvancing] = useState(false)
  const [confirmingPago, setConfirmingPago] = useState<string | null>(null)

  const currentViaje = viaje ?? viajeInicial
  const currentReservas = (reservas.length > 0 ? reservas : reservasIniciales) as unknown as PassengerWithProfile[]

  const nextState = NEXT_TRIP_STATE[currentViaje?.estado as TripState]
  const currentStateIdx = TRIP_STATE_STEPS.indexOf(currentViaje?.estado as TripState)

  const enElPunto = currentReservas.filter(r => r.estado_pasajero === 'en_el_punto').length
  const enCamino  = currentReservas.filter(r => r.estado_pasajero === 'en_camino').length
  const llegaron  = currentReservas.filter(r => r.estado_pasajero === 'llego').length
  const pagados   = currentReservas.filter(r => r.pago_confirmado).length

  async function advanceTripState() {
    if (!nextState) return
    setAdvancing(true)
    await supabase
      .from('viajes')
      .update({ estado: nextState.state })
      .eq('id', viajeId)
    setAdvancing(false)
  }

  async function confirmPago(reservaId: string) {
    setConfirmingPago(reservaId)
    await supabase
      .from('reservas')
      .update({ estado_pasajero: 'pago_confirmado', pago_confirmado: true })
      .eq('id', reservaId)
    setConfirmingPago(null)
  }

  async function cancelTrip() {
    if (!confirm('¿Seguro que quieres cancelar este viaje?')) return
    await supabase.from('viajes').update({ estado: 'cancelado' }).eq('id', viajeId)
  }

  if (loading && !viaje) {
    return <div className="page-container"><div className="animate-pulse space-y-3 mt-6">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-surface-overlay rounded-2xl" />)}</div></div>
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="pt-2 mb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink-primary">Mi Viaje</h1>
          <span className={cn(
            'badge border font-semibold text-xs',
            currentViaje?.estado === 'en_camino'  ? 'text-warning bg-warning/10 border-warning/20 animate-pulse' :
            currentViaje?.estado === 'confirmado' ? 'text-success bg-success/10 border-success/20' :
            currentViaje?.estado === 'en_destino' ? 'text-brand bg-brand/10 border-brand/20' :
            'text-info bg-info/10 border-info/20'
          )}>
            {TRIP_STATE_LABEL[currentViaje?.estado as TripState] ?? '—'}
          </span>
        </div>
        <p className="text-ink-secondary text-sm mt-1">
          {currentViaje?.origen} → {currentViaje?.destino} · {currentViaje && formatTime(currentViaje.fecha_hora)}
        </p>
      </div>

      {/* Progress stepper */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between">
          {TRIP_STATE_STEPS.slice(0, 4).map((s, i) => (
            <div key={s} className="flex items-center flex-1">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                i < currentStateIdx  ? 'bg-brand text-white' :
                i === currentStateIdx ? 'bg-brand text-white ring-4 ring-brand/30' :
                'bg-surface-overlay text-ink-muted border border-surface-border'
              )}>
                {i < currentStateIdx ? '✓' : i + 1}
              </div>
              {i < 3 && (
                <div className={cn('flex-1 h-0.5 mx-1 transition-all', i < currentStateIdx ? 'bg-brand' : 'bg-surface-border')} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {['Publicado', 'Confirmado', 'En camino', 'Destino'].map((l, i) => (
            <p key={l} className={cn(
              'text-[9px] font-medium flex-1 text-center',
              i <= currentStateIdx ? 'text-brand' : 'text-ink-muted'
            )}>{l}</p>
          ))}
        </div>
      </div>

      {/* Passenger summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="En punto" value={enElPunto} icon="📍" highlight={enElPunto > 0} />
        <StatCard label="Llegaron" value={llegaron}  icon="🏁" highlight={llegaron > 0} />
        <StatCard label="Pagaron"  value={`${pagados}/${currentReservas.length}`} icon="💰" highlight={pagados === currentReservas.length && currentReservas.length > 0} />
      </div>

      {/* Passenger list */}
      {currentReservas.length > 0 ? (
        <div className="card mb-4">
          <div className="px-4 pt-4 pb-2 flex items-center gap-2 border-b border-surface-border">
            <Users size={14} className="text-ink-muted" />
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
              Pasajeros ({currentReservas.length})
            </p>
          </div>
          <div className="divide-y divide-surface-border">
            {currentReservas.map((r) => {
              const estado = r.estado_pasajero as PassengerState
              const isLlego = estado === 'llego'
              const isPagado = r.pago_confirmado

              return (
                <div key={r.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all',
                      estado === 'en_el_punto' ? 'bg-brand/20 text-brand ring-2 ring-brand/40' :
                      estado === 'llego'        ? 'bg-success/20 text-success' :
                      isPagado                  ? 'bg-success/20 text-success' :
                      'bg-surface-overlay text-ink-secondary'
                    )}>
                      {(r.pasajero as any)?.nombre?.[0]?.toUpperCase() ?? '?'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink-primary text-sm truncate">
                        {(r.pasajero as any)?.nombre || 'Pasajero'}
                      </p>
                      <p className="text-xs text-ink-secondary mt-0.5">
                        {PASSENGER_STATE_EMOJI[estado]} {PASSENGER_STATE_LABEL[estado]}
                      </p>
                    </div>

                    {/* Action */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/chat/${r.id}`}
                        className="w-8 h-8 rounded-xl bg-surface-overlay border border-surface-border
                                   flex items-center justify-center text-brand active:scale-95 transition-all"
                      >
                        <MessageCircle size={14} />
                      </Link>
                      {isPagado ? (
                        <span className="flex items-center gap-1 text-xs text-success font-semibold">
                          <CheckCircle size={14} /> Pagado
                        </span>
                      ) : isLlego ? (
                        <button
                          onClick={() => confirmPago(r.id)}
                          disabled={confirmingPago === r.id}
                          className="bg-success/10 border border-success/30 text-success text-xs font-bold rounded-xl px-3 py-2 active:scale-95 transition-all"
                        >
                          {confirmingPago === r.id ? '…' : `💰 ${formatPrice((currentViaje as any)?.precio_cupo ?? 4000)}`}
                        </button>
                      ) : (
                        <span className={cn(
                          'text-lg',
                          estado === 'en_el_punto' && 'animate-pulse-dot'
                        )}>
                          {PASSENGER_STATE_EMOJI[estado]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="card p-6 text-center mb-4">
          <p className="text-ink-muted text-sm">Aún no hay pasajeros reservados</p>
          <p className="text-xs text-ink-muted mt-1">Comparte el link del viaje</p>
        </div>
      )}

      {/* CTA — advance state */}
      {nextState && currentViaje?.estado !== 'finalizado' && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 max-w-md mx-auto space-y-2">
          <button
            onClick={advanceTripState}
            disabled={advancing}
            className={cn('btn-primary w-full py-4 text-base font-bold shadow-glow', nextState.color)}
          >
            {advancing ? 'Actualizando…' : nextState.label}
          </button>
          {currentViaje?.estado === 'publicado' && (
            <button onClick={cancelTrip} className="btn-ghost w-full text-danger/60 text-sm">
              Cancelar viaje
            </button>
          )}
        </div>
      )}

      {/* Finalizado */}
      {currentViaje?.estado === 'finalizado' && (
        <div className="card p-6 text-center">
          <p className="text-4xl mb-3">🏁</p>
          <p className="text-ink-primary font-bold text-lg">Viaje finalizado</p>
          <p className="text-ink-muted text-sm mt-1">
            {pagados}/{currentReservas.length} pagos confirmados ·{' '}
            {formatPrice((currentViaje as any)?.precio_cupo * pagados)} total
          </p>
          <a href="/mis-viajes" className="btn-secondary w-full mt-4 block text-center">
            Ver mis viajes
          </a>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: string; highlight?: boolean }) {
  return (
    <div className={cn('card p-3 text-center transition-all', highlight && 'border-brand/40 bg-brand/5')}>
      <p className="text-lg">{icon}</p>
      <p className={cn('text-xl font-bold mt-0.5', highlight ? 'text-brand' : 'text-ink-primary')}>{value}</p>
      <p className="text-[10px] text-ink-muted mt-0.5">{label}</p>
    </div>
  )
}
