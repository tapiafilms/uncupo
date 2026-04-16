export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { TripCard } from '@/components/trips/TripCard'
import { TripFilters } from '@/components/trips/TripFilters'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { AppHeader } from '@/components/layout/AppHeader'
import { RefreshButton } from '@/components/ui/RefreshButton'
import type { ViajeConChofer } from '@/lib/types'
import { PUNTOS_VINA } from '@/lib/types'

interface HomePageProps {
  searchParams: Promise<{ ruta?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { ruta = 'vina-stgo' } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, foto_url')
    .eq('id', user!.id)
    .single()

  // Mostrar viajes desde hace 15 min en adelante, próximos 30 días
  const now = new Date(new Date().getTime() - 15 * 60 * 1000)
  const max = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // Filtro de dirección
  const puntosVina = PUNTOS_VINA as unknown as string[]
  let query = supabase
    .from('viajes')
    .select(`*, chofer:users!viajes_chofer_id_fkey(*), vehiculo:vehiculos(*)`)
    .gte('fecha_hora', now.toISOString())
    .lt('fecha_hora', max.toISOString())
    .in('estado', ['publicado', 'confirmado'])
    .gt('cupos_disponibles', 0)
    .order('fecha_hora', { ascending: true })
    .limit(50)

  if (ruta === 'vina-stgo') {
    query = query.in('origen', puntosVina)
  } else {
    query = query.in('destino', puntosVina)
  }

  const { data: viajes } = await query

  const trips  = (viajes ?? []) as unknown as ViajeConChofer[]
  const nombre = profile?.nombre?.split(' ')[0] || 'Viajero'
  const fotoUrl = profile?.foto_url as string | null ?? null

  const hora   = new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago', hour: 'numeric', hour12: false })
  const saludo = Number(hora) < 12 ? 'Buenos días' : Number(hora) < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div>
      {/* ── Hero con imagen de fondo ── */}
      <div
        className="relative bg-cover bg-center px-4 pt-4 pb-6"
        style={{ backgroundImage: "url('/bg-header.png')" }}
      >
        <div className="absolute inset-0 bg-surface-base/60" />
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-b from-transparent to-surface-base" />

        <div className="relative z-10">
          <AppHeader right={<NotificationCenter userId={user!.id} />} />

          <div className="flex items-center gap-3 mb-5 pt-8">
            <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-brand/20 flex items-center justify-center ring-2 ring-white/20">
              {fotoUrl
                ? <img src={fotoUrl} alt={nombre} className="w-full h-full object-cover" />
                : <span className="text-sm font-bold text-brand">{nombre[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="text-xs text-white/60 leading-none mb-0.5">{saludo}</p>
              <p className="text-base font-bold text-white leading-none">{nombre} 👋</p>
            </div>
          </div>

          {/* Filtro de dirección */}
          <Suspense>
            <TripFilters />
          </Suspense>
        </div>
      </div>

      {/* ── Contenido ── */}
      <div className="max-w-md mx-auto px-4 pb-24 pt-3">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-ink-muted">
            {trips.length > 0
              ? `${trips.length} viaje${trips.length !== 1 ? 's' : ''} disponible${trips.length !== 1 ? 's' : ''}`
              : 'Sin viajes publicados'}
          </p>
          <RefreshButton />
        </div>

        {trips.length === 0 ? (
          <EmptyState ruta={ruta} />
        ) : (
          <div className="space-y-3 animate-fade-in">
            {trips.map((viaje) => (
              <TripCard key={viaje.id} viaje={viaje} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState({ ruta }: { ruta: string }) {
  const dir = ruta === 'vina-stgo' ? 'Viña → Santiago' : 'Santiago → Viña'
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-full bg-surface-overlay flex items-center justify-center mb-4">
        <span className="text-4xl">🛣️</span>
      </div>
      <p className="text-ink-primary font-semibold text-lg">No hay viajes</p>
      <p className="text-ink-muted text-sm mt-1 max-w-xs">
        No hay viajes publicados en dirección {dir}. ¡Publica el tuyo!
      </p>
      <a href="/publicar" className="btn-primary mt-6 inline-flex items-center gap-2 text-sm">
        + Publicar viaje
      </a>
    </div>
  )
}
