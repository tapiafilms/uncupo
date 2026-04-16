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
import { TripMap } from './TripMap'
import { EditTripButton } from './EditTripButton'

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

  // Check for scheduling conflict (±2h) — only relevant if not already reserved in this trip
  let viajeConflicto = false
  if (!isDriver && !yaReservado) {
    const tripDate = new Date(trip.fecha_hora)
    const desde = new Date(tripDate.getTime() - 2 * 60 * 60 * 1000).toISOString()
    const hasta = new Date(tripDate.getTime() + 2 * 60 * 60 * 1000).toISOString()

    const { data: reservasActivas } = await supabase
      .from('reservas')
      .select('id, viaje:viajes!inner(id, fecha_hora, estado)')
      .eq('pasajero_id', user.id)
      .not('estado_pasajero', 'eq', 'pago_confirmado')

    viajeConflicto = (reservasActivas ?? []).some((r: any) => {
      const fh = r.viaje?.fecha_hora
      const estado = r.viaje?.estado
      if (!fh || ['finalizado', 'cancelado'].includes(estado)) return false
      return fh >= desde && fh <= hasta
    })
  }

  // Fetch co-passengers for passenger view
  let coPasajeros: Array<{ id: string; nombre: string; foto_url: string | null }> = []
  if (!isDriver && yaReservado && trip.reservas?.length > 0) {
    const ids = trip.reservas.map((r) => r.pasajero_id)
    const { data: profiles } = await supabase
      .from('users')
      .select('id, nombre, foto_url')
      .in('id', ids)
    coPasajeros = (profiles ?? []).map((p) => ({
      id: p.id,
      nombre: p.nombre,
      foto_url: p.foto_url ?? null,
    }))
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

      {/* Reservation status — inline, only when already reserved */}
      {!isDriver && yaReservado && (
        <div className="mb-4">
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

      {/* Punto de encuentro con mapa */}
      {((trip as any).notas || (trip as any).punto_encuentro_lat) && (
        <div className="card p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin size={14} className="text-brand" />
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Punto de encuentro</p>
          </div>
          {(trip as any).notas && (
            <p className="text-sm text-ink-primary mb-3">{(trip as any).notas}</p>
          )}
          {(trip as any).punto_encuentro_lat && (trip as any).punto_encuentro_lng && (
            <TripMap
              lat={(trip as any).punto_encuentro_lat}
              lng={(trip as any).punto_encuentro_lng}
              label={(trip as any).notas}
            />
          )}
        </div>
      )}

      {/* Edit trip button — driver only, editable states */}
      {isDriver && ['publicado', 'confirmado'].includes(trip.estado) && (
        <EditTripButton
          viajeId={trip.id}
          inicial={{
            fecha: new Date(trip.fecha_hora).toLocaleDateString('en-CA', { timeZone: 'America/Santiago' }),
            hora:  new Date(trip.fecha_hora).toLocaleTimeString('es-CL', { timeZone: 'America/Santiago', hour: '2-digit', minute: '2-digit', hour12: false }),
            precio: trip.precio_cupo,
            cupos:  trip.cupos_total,
            notas:  trip.notas ?? '',
            reservados: trip.cupos_total - trip.cupos_disponibles,
          }}
        />
      )}

      {/* Confirm trip CTA — driver with pending passengers */}
      {isDriver && trip.estado === 'publicado' && pasajeros.length > 0 && (
        <a
          href="/viaje-activo"
          className="flex items-center gap-3 bg-brand/10 border border-brand/30 rounded-2xl p-4 mb-4"
        >
          <span className="text-2xl">✅</span>
          <div className="flex-1">
            <p className="text-brand font-bold text-sm">Tienes pasajeros esperando</p>
            <p className="text-brand/70 text-xs">Entra a confirmarles el viaje</p>
          </div>
          <span className="text-brand text-xs font-semibold">Confirmar →</span>
        </a>
      )}

      {/* Passenger list (driver only) */}
      {isDriver && pasajeros.length > 0 && (
        <PassengerList pasajeros={pasajeros} viajeId={trip.id} />
      )}

      {/* Co-passengers (passenger view, only when reserved) */}
      {!isDriver && yaReservado && coPasajeros.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">
            Viajando juntos ({coPasajeros.length})
          </p>
          <div className="flex flex-col gap-3">
            {coPasajeros.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-brand/20 flex items-center justify-center shrink-0 overflow-hidden">
                  {p.foto_url
                    ? <img src={p.foto_url} alt={p.nombre} className="w-full h-full object-cover" />
                    : <span className="text-sm font-bold text-brand">{p.nombre[0]?.toUpperCase()}</span>
                  }
                </div>
                <span className="text-sm text-ink-primary font-medium">{p.nombre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reserve button — floating, only when not yet reserved */}
      {!isDriver && !yaReservado && (
        <div className="fixed bottom-20 left-0 right-0 px-4 pb-2 max-w-md mx-auto">
          {viajeConflicto ? (
            <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 text-center">
              <p className="text-warning font-semibold text-sm">⚠️ Ya tienes un viaje en este horario</p>
              <p className="text-warning/70 text-xs mt-1">Tienes una reserva activa dentro de las ±2 horas de este viaje</p>
            </div>
          ) : (
            <ReserveButton
              viajeId={trip.id}
              pasajeroId={user.id}
              cuposDisponibles={trip.cupos_disponibles}
              precio={trip.precio_cupo}
              estado={trip.estado}
              yaReservado={false}
            />
          )}
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
