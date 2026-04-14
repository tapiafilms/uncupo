import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TripCard } from '@/components/trips/TripCard'
import { TripFilters } from '@/components/trips/TripFilters'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import type { ViajeConChofer } from '@/lib/types'

interface HomePageProps {
  searchParams: Promise<{
    dia?: string
    origen?: string
    destino?: string
  }>
}

function getDateRange(dia: string): { from: string; to: string } {
  const now = new Date()
  const tz = 'America/Santiago'
  const today = new Date(new Date().toLocaleString('en-US', { timeZone: tz }))
  today.setHours(0, 0, 0, 0)

  if (dia === 'manana') {
    const start = new Date(today); start.setDate(start.getDate() + 1)
    const end   = new Date(today); end.setDate(end.getDate() + 2)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (dia === 'semana') {
    const end = new Date(today); end.setDate(end.getDate() + 7)
    return { from: now.toISOString(), to: end.toISOString() }
  }
  // hoy (default)
  const end = new Date(today); end.setDate(end.getDate() + 1)
  return { from: now.toISOString(), to: end.toISOString() }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { dia = 'hoy', origen = '', destino = '' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch user name for greeting
  const { data: profile } = await supabase
    .from('users')
    .select('nombre')
    .eq('id', user!.id)
    .single()

  const { from, to } = getDateRange(dia)

  let query = supabase
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
    .limit(30)

  if (origen)  query = query.ilike('origen', `%${origen}%`)
  if (destino) query = query.ilike('destino', `%${destino}%`)

  const { data: viajes } = await query
  const trips = (viajes ?? []) as unknown as ViajeConChofer[]

  const nombre = profile?.nombre?.split(' ')[0] || 'Viajero'
  const hora = new Date().toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    hour: 'numeric',
    hour12: false
  })
  const saludo = Number(hora) < 12 ? 'Buenos días' : Number(hora) < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 pt-2">
        <div>
          <p className="text-ink-muted text-sm">{saludo}</p>
          <h1 className="text-2xl font-bold text-ink-primary">{nombre} 👋</h1>
        </div>
        <NotificationCenter userId={user!.id} />
      </div>

      {/* Filters */}
      <Suspense>
        <TripFilters />
      </Suspense>

      {/* Count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-ink-secondary">
          {trips.length > 0
            ? `${trips.length} viaje${trips.length !== 1 ? 's' : ''} encontrado${trips.length !== 1 ? 's' : ''}`
            : 'Sin resultados'}
        </p>
        {(origen || destino) && (
          <a href="/home" className="text-xs text-brand font-medium">
            Limpiar filtros
          </a>
        )}
      </div>

      {/* Trip list */}
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
        {dia === 'hoy' && 'No hay viajes publicados para hoy. ¡Publica el tuyo!'}
        {dia === 'manana' && 'Nadie ha publicado para mañana aún.'}
        {dia === 'semana' && 'No hay viajes esta semana todavía.'}
      </p>
      <a
        href="/publicar"
        className="btn-primary mt-6 inline-flex items-center gap-2 text-sm"
      >
        + Publicar viaje
      </a>
    </div>
  )
}
