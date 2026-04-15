export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TripCard } from '@/components/trips/TripCard'
import { TripFilters } from '@/components/trips/TripFilters'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import type { ViajeConChofer } from '@/lib/types'

interface HomePageProps {
  searchParams: Promise<{ dia?: string }>
}

function getDateRange(dia: string): { from: string; to: string } {
  const tz    = 'America/Santiago'
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  today.setHours(0, 0, 0, 0)

  if (dia === 'manana') {
    const start = new Date(today); start.setDate(start.getDate() + 1)
    const end   = new Date(today); end.setDate(end.getDate() + 2)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (dia === 'semana') {
    const end = new Date(today); end.setDate(end.getDate() + 7)
    return { from: today.toISOString(), to: end.toISOString() }
  }
  // hoy — desde inicio del día para mostrar todos los viajes aunque ya pasaron
  const end = new Date(today); end.setDate(end.getDate() + 1)
  return { from: today.toISOString(), to: end.toISOString() }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { dia = 'hoy' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, foto_url')
    .eq('id', user!.id)
    .single()

  const { from, to } = getDateRange(dia)

  const { data: viajes } = await supabase
    .from('viajes')
    .select(`
      *,
      chofer:users!viajes_chofer_id_fkey(*),
      vehiculo:vehiculos(*)
    `)
    .gte('fecha_hora', from)
    .lt('fecha_hora', to)
    .in('estado', ['publicado', 'confirmado'])
    .order('fecha_hora', { ascending: true })
    .limit(50)

  const trips  = (viajes ?? []) as unknown as ViajeConChofer[]
  const nombre = profile?.nombre?.split(' ')[0] || 'Viajero'
  const fotoUrl = profile?.foto_url as string | null ?? null

  const hora   = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', hour: 'numeric', hour12: false })
  const saludo = Number(hora) < 12 ? 'Buenos días' : Number(hora) < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="page-container">

      {/* App header con logo */}
      <div className="flex items-center justify-between pt-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center">
            <span className="text-base">🚗</span>
          </div>
          <span className="text-lg font-bold gradient-text">UnCupo</span>
        </div>
        <NotificationCenter userId={user!.id} />
      </div>

      {/* Saludo con avatar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-brand/20 flex items-center justify-center">
          {fotoUrl
            ? <img src={fotoUrl} alt={nombre} className="w-full h-full object-cover" />
            : <span className="text-sm font-bold text-brand">{nombre[0]?.toUpperCase()}</span>
          }
        </div>
        <div>
          <p className="text-xs text-ink-muted leading-none mb-0.5">{saludo}</p>
          <p className="text-base font-bold text-ink-primary leading-none">{nombre} 👋</p>
        </div>
      </div>

      {/* Filtro de días */}
      <Suspense>
        <TripFilters />
      </Suspense>

      {/* Contador */}
      <p className="text-xs font-semibold text-ink-muted mb-3">
        {trips.length > 0
          ? `${trips.length} viaje${trips.length !== 1 ? 's' : ''} disponible${trips.length !== 1 ? 's' : ''}`
          : 'Sin viajes publicados'}
      </p>

      {/* Lista de viajes */}
      {trips.length === 0 ? (
        <EmptyState dia={dia} />
      ) : (
        <div className="space-y-3 animate-fade-in">
          {trips.map((viaje) => (
            <TripCard key={viaje.id} viaje={viaje} />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({ dia }: { dia: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-surface-overlay flex items-center justify-center mb-4">
        <span className="text-4xl">🛣️</span>
      </div>
      <p className="text-ink-primary font-semibold text-lg">No hay viajes</p>
      <p className="text-ink-muted text-sm mt-1 max-w-xs">
        {dia === 'hoy'    && 'No hay viajes publicados para hoy. ¡Publica el tuyo!'}
        {dia === 'manana' && 'Nadie ha publicado para mañana aún.'}
        {dia === 'semana' && 'No hay viajes esta semana todavía.'}
      </p>
      <a href="/publicar" className="btn-primary mt-6 inline-flex items-center gap-2 text-sm">
        + Publicar viaje
      </a>
    </div>
  )
}
