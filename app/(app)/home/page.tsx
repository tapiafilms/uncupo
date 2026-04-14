import { createClient } from '@/lib/supabase/server'
import { MapPin, Clock, Users } from 'lucide-react'
import { formatRelativeDay, formatTime, formatPrice } from '@/lib/utils'
import type { ViajeConChofer } from '@/lib/types'

export default async function HomePage() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: viajes } = await supabase
    .from('viajes')
    .select(`
      *,
      chofer:users!viajes_chofer_id_fkey(*),
      vehiculo:vehiculos(*)
    `)
    .gte('fecha_hora', today.toISOString())
    .in('estado', ['publicado', 'confirmado'])
    .order('fecha_hora', { ascending: true })
    .limit(20)

  const trips = (viajes ?? []) as unknown as ViajeConChofer[]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div>
          <h1 className="text-2xl font-bold text-ink-primary">Viajes de hoy</h1>
          <p className="text-sm text-ink-secondary mt-0.5">Viña ↔ Santiago</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center">
          <span className="text-lg">🚗</span>
        </div>
      </div>

      {/* Trip list */}
      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <span className="text-5xl mb-4">🛣️</span>
          <p className="text-ink-secondary font-medium">No hay viajes disponibles</p>
          <p className="text-ink-muted text-sm mt-1">Sé el primero en publicar uno</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trips.map((viaje) => (
            <TripCard key={viaje.id} viaje={viaje} />
          ))}
        </div>
      )}
    </div>
  )
}

function TripCard({ viaje }: { viaje: ViajeConChofer }) {
  const cuposOcupados = viaje.cupos_total - viaje.cupos_disponibles

  return (
    <a
      href={`/viajes/${viaje.id}`}
      className="card block p-4 hover:border-brand/40 transition-colors active:scale-[0.99]"
    >
      {/* Route */}
      <div className="flex items-start gap-3 mb-3">
        <div className="flex flex-col items-center pt-1 gap-1">
          <span className="w-2 h-2 rounded-full bg-brand" />
          <span className="w-px h-6 bg-surface-border" />
          <span className="w-2 h-2 rounded-full bg-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-primary text-sm leading-tight">{viaje.origen}</p>
          <p className="text-ink-muted text-xs mt-1">→</p>
          <p className="font-semibold text-ink-primary text-sm leading-tight mt-1">{viaje.destino}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-brand font-bold text-lg">{formatPrice(viaje.precio_cupo)}</p>
          <p className="text-ink-muted text-xs">por cupo</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-ink-secondary">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatRelativeDay(viaje.fecha_hora)} · {formatTime(viaje.fecha_hora)}
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {cuposOcupados}/{viaje.cupos_total}
          <span className="text-ink-muted ml-0.5">({viaje.cupos_disponibles} libre{viaje.cupos_disponibles !== 1 ? 's' : ''})</span>
        </span>
      </div>

      {/* Driver */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-border">
        <div className="w-6 h-6 rounded-full bg-brand/20 flex items-center justify-center text-xs">
          {viaje.chofer?.nombre?.[0] ?? '?'}
        </div>
        <span className="text-xs text-ink-secondary">
          {viaje.chofer?.nombre || 'Chofer'}
        </span>
        {viaje.chofer?.calificacion_promedio > 0 && (
          <span className="ml-auto text-xs text-warning">
            ★ {viaje.chofer.calificacion_promedio.toFixed(1)}
          </span>
        )}
      </div>
    </a>
  )
}
