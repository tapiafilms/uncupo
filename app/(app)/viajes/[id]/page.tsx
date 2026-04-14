export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { formatDateTime, formatPrice } from '@/lib/utils'
import { MapPin, Clock, Users, Car, Star, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import type { ViajeConChofer, DbReserva } from '@/lib/types'
import { ReserveButton } from './ReserveButton'
import { TripStatusBadge } from './TripStatusBadge'
import { PassengerList } from './PassengerList'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ nuevo?: string }>
}

export default async function ViajeDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { nuevo } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch trip with relations
  const { data: viaje, error } = await supabase
    .from('viajes')
    .select(`
      *,
      chofer:users!viajes_chofer_id_fkey(*),
      vehiculo:vehiculos(*),
      reservas(*)
    `)
    .eq('id', id)
    .single()

  if (error || !viaje) notFound()

  const trip = viaje as unknown as ViajeConChofer & { reservas: DbReserva[] }
  const isDriver = user.id === trip.chofer_id

  // Check if current user has a reservation
  const miReserva = trip.reservas?.find((r) => r.pasajero_id === user.id)
  const yaReservado = !!miReserva

  // Fetch passenger names for driver view
  let pasajeros: Array<{ id: string; nombre: string; telefono: string; estado: string }> = []
  if (isDriver && trip.reservas?.length > 0) {
    const ids = trip.reservas.map((r) => r.pasajero_id)
    const { data: profiles } = await supabase
      .from('users')
      .select('id, nombre, telefono')
      .in('id', ids)

    pasajeros = trip.reservas.map((r) => {
      const p = profiles?.find((u) => u.id === r.pasajero_id)
      return {
        id: r.id,
        nombre: p?.nombre || 'Pasajero',
        telefono: p?.telefono || '',
        estado: r.estado_pasajero,
      }
    })
  }

  const ocupados = trip.cupos_total - trip.cupos_disponibles

  return (
    <div className="page-container">
      {/* Back */}
      <div className="flex items-center gap-3 pt-2 mb-5">
        <Link href="/home" className="btn-ghost p-2 -ml-2">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-bold text-ink-primary">Detalle del viaje</h1>
        <div className="ml-auto">
          <TripStatusBadge estado={trip.estado} />
        </div>
      </div>

      {/* Success banner */}
      {nuevo === '1' && (
        <div className="bg-success/10 border border-success/30 rounded-2xl p-4 mb-4 animate-slide-up">
          <p className="text-success font-semibold text-sm">🎉 ¡Viaje publicado!</p>
          <p className="text-success/70 text-xs mt-0.5">Ya es visible para los pasajeros</p>
        </div>
      )}

      {/* Route card */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center pt-1 gap-1">
            <span className="w-3 h-3 rounded-full bg-brand ring-2 ring-brand/30" />
            <span className="w-px flex-1 min-h-[40px] bg-gradient-to-b from-brand/50 to-success/50" />
            <span className="w-3 h-3 rounded-full bg-success ring-2 ring-success/30" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-ink-muted mb-0.5">Salida</p>
                <p className="font-bold text-ink-primary text-lg leading-tight">{trip.origen}</p>
              </div>
              <p className="text-brand font-bold text-2xl">{formatPrice(trip.precio_cupo)}</p>
            </div>
            <div className="mt-5">
              <p className="text-xs text-ink-muted mb-0.5">Llegada</p>
              <p className="font-bold text-ink-primary text-lg leading-tight">{trip.destino}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <InfoCell icon={Clock} label="Fecha y hora" value={formatDateTime(trip.fecha_hora)} />
        <InfoCell
          icon={Users}
          label="Cupos"
          value={`${trip.cupos_disponibles} libre${trip.cupos_disponibles !== 1 ? 's' : ''} de ${trip.cupos_total}`}
          highlight={trip.cupos_disponibles === 0 ? 'danger' : trip.cupos_disponibles <= 1 ? 'warning' : undefined}
        />
        {trip.vehiculo && (
          <InfoCell
            icon={Car}
            label="Vehículo"
            value={`${trip.vehiculo.marca} ${trip.vehiculo.modelo}`}
            sub={`${trip.vehiculo.color} · ${trip.vehiculo.patente}`}
          />
        )}
        {trip.notas && (
          <InfoCell icon={FileText} label="Notas" value={trip.notas} />
        )}
      </div>

      {/* Driver card */}
      <a href={`/usuario/${trip.chofer_id}`} className="card block p-4 mb-4 hover:border-brand/40 transition-colors">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Chofer →</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand/20 flex items-center justify-center text-xl font-bold text-brand">
            {trip.chofer?.nombre?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-ink-primary">{trip.chofer?.nombre || 'Sin nombre'}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {trip.chofer?.calificacion_promedio > 0 && (
                <span className="flex items-center gap-1 text-xs text-warning">
                  <Star size={11} className="fill-warning" />
                  {Number(trip.chofer.calificacion_promedio).toFixed(1)}
                </span>
              )}
              <span className="text-xs text-ink-muted">
                {trip.chofer?.total_viajes ?? 0} viajes
              </span>
              <span className="text-xs text-ink-muted">
                Nivel {trip.chofer?.nivel_confianza ?? 1}
              </span>
            </div>
          </div>
        </div>
      </a>

      {/* Seats bar */}
      <div className="card p-4 mb-4">
        <div className="flex justify-between mb-2">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Ocupación</p>
          <p className="text-xs text-ink-secondary">{ocupados} de {trip.cupos_total}</p>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: trip.cupos_total }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-3 rounded-full transition-all ${
                i < ocupados ? 'bg-brand' : 'bg-surface-overlay border border-surface-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Passenger list (driver only) */}
      {isDriver && pasajeros.length > 0 && (
        <PassengerList pasajeros={pasajeros} viajeId={trip.id} />
      )}

      {/* Reserve button (passenger only) */}
      {!isDriver && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 max-w-md mx-auto">
          <ReserveButton
            viajeId={trip.id}
            pasajeroId={user.id}
            cuposDisponibles={trip.cupos_disponibles}
            precio={trip.precio_cupo}
            estado={trip.estado}
            yaReservado={yaReservado}
            reservaId={miReserva?.id}
            estadoPasajero={miReserva?.estado_pasajero}
          />
        </div>
      )}

      {/* Rating CTA — viaje finalizado */}
      {trip.estado === 'finalizado' && (
        <div className="card p-4 mb-4 text-center border-brand/30">
          <p className="text-2xl mb-2">⭐</p>
          <p className="font-semibold text-ink-primary text-sm">¿Cómo estuvo el viaje?</p>
          <p className="text-xs text-ink-muted mt-1 mb-3">Tus calificaciones ayudan a la comunidad</p>
          <a href={`/calificar/${trip.id}`} className="btn-primary w-full text-sm py-3 block">
            Calificar viaje
          </a>
        </div>
      )}
    </div>
  )
}

function InfoCell({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  highlight?: 'danger' | 'warning'
}) {
  return (
    <div className="card p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-brand" />
        <p className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-sm font-semibold leading-tight ${
        highlight === 'danger' ? 'text-danger' :
        highlight === 'warning' ? 'text-warning' :
        'text-ink-primary'
      }`}>
        {value}
      </p>
      {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
    </div>
  )
}
