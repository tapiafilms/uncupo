export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Star, Car, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { calcularBadges } from '@/lib/badges'
import { formatDateTime } from '@/lib/utils'
import type { DbUser, DbCalificacion } from '@/lib/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UsuarioPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) notFound()

  const user = profile as DbUser

  // Fetch recent ratings received
  const { data: calificaciones } = await supabase
    .from('calificaciones')
    .select('*, de_user:users!calificaciones_de_user_id_fkey(nombre)')
    .eq('a_user_id', id)
    .order('creado_en', { ascending: false })
    .limit(10)

  // Fetch trip count as driver
  const { count: viajesComoChofer } = await supabase
    .from('viajes')
    .select('*', { count: 'exact', head: true })
    .eq('chofer_id', id)
    .eq('estado', 'finalizado')

  // Fetch trip count as passenger
  const { count: viajesComoPasajero } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('pasajero_id', id)
    .eq('pago_confirmado', true)

  const badges = calcularBadges({
    total_viajes: user.total_viajes,
    calificacion_promedio: Number(user.calificacion_promedio),
    nivel_confianza: user.nivel_confianza,
  })

  const ratings = (calificaciones ?? []) as unknown as (DbCalificacion & { de_user: { nombre: string } })[]
  const dist = [5,4,3,2,1].map(s => ({
    stars: s,
    count: ratings.filter(r => r.estrellas === s).length,
    pct: ratings.length ? Math.round(ratings.filter(r => r.estrellas === s).length / ratings.length * 100) : 0,
  }))

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 pt-2 mb-5">
        <Link href="/home" className="btn-ghost p-2 -ml-2"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold text-ink-primary">Perfil</h1>
      </div>

      {/* Hero */}
      <div className="card p-6 mb-4 text-center">
        <div className="w-20 h-20 rounded-full bg-brand/20 flex items-center justify-center text-3xl font-bold text-brand mx-auto mb-3">
          {user.nombre?.[0]?.toUpperCase() ?? '?'}
        </div>
        <h2 className="text-xl font-bold text-ink-primary">{user.nombre || 'Sin nombre'}</h2>

        {user.calificacion_promedio > 0 && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star size={16} className="text-warning fill-warning" />
            <span className="text-lg font-bold text-ink-primary">{Number(user.calificacion_promedio).toFixed(2)}</span>
            <span className="text-ink-muted text-sm">({ratings.length} reseñas)</span>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {badges.map(b => (
              <span key={b.id} className={`badge border text-xs font-semibold ${b.color}`}>
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard value={user.total_viajes} label="Total viajes" icon="🚗" />
        <StatCard value={viajesComoChofer ?? 0} label="Como chofer" icon="🏎️" />
        <StatCard value={viajesComoPasajero ?? 0} label="Como pasajero" icon="🎫" />
      </div>

      {/* Rating distribution */}
      {ratings.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">Distribución</p>
          <div className="space-y-2">
            {dist.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs text-ink-secondary w-6">{stars}★</span>
                <div className="flex-1 h-2 bg-surface-overlay rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-ink-muted w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {ratings.length > 0 && (
        <div className="space-y-3 mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Reseñas recientes</p>
          {ratings.map(r => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-ink-primary">{r.de_user?.nombre ?? 'Usuario'}</p>
                <div className="flex">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={12} className={s <= r.estrellas ? 'text-warning fill-warning' : 'text-surface-subtle'} />
                  ))}
                </div>
              </div>
              {r.comentario && (
                <p className="text-sm text-ink-secondary leading-relaxed">"{r.comentario}"</p>
              )}
              <p className="text-xs text-ink-muted mt-2">{formatDateTime(r.creado_en)}</p>
            </div>
          ))}
        </div>
      )}

      {ratings.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-ink-muted text-sm">Sin reseñas aún</p>
        </div>
      )}
    </div>
  )
}

function StatCard({ value, label, icon }: { value: number; label: string; icon: string }) {
  return (
    <div className="card p-3 text-center">
      <p className="text-xl">{icon}</p>
      <p className="text-xl font-bold text-ink-primary mt-1">{value}</p>
      <p className="text-[10px] text-ink-muted mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
