export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Star, Car, ArrowLeft, MapPin } from 'lucide-react'
import Link from 'next/link'
import { calcularBadges } from '@/lib/badges'
import { formatDateTime } from '@/lib/utils'
import type { DbUser, DbCalificacion, DbVehiculo } from '@/lib/types'

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

  const [
    { data: calificaciones },
    { count: viajesComoChofer },
    { count: viajesComoPasajero },
    { data: vehiculos },
    { data: ultimoViaje },
  ] = await Promise.all([
    supabase
      .from('calificaciones')
      .select('*, de_user:users!calificaciones_de_user_id_fkey(nombre)')
      .eq('a_user_id', id)
      .order('creado_en', { ascending: false })
      .limit(10),
    supabase
      .from('viajes')
      .select('*', { count: 'exact', head: true })
      .eq('chofer_id', id)
      .eq('estado', 'finalizado'),
    supabase
      .from('reservas')
      .select('*', { count: 'exact', head: true })
      .eq('pasajero_id', id)
      .eq('pago_confirmado', true),
    supabase
      .from('vehiculos')
      .select('*')
      .eq('user_id', id),
    supabase
      .from('viajes')
      .select('origen')
      .eq('chofer_id', id)
      .order('creado_en', { ascending: false })
      .limit(1)
      .single(),
  ])

  const badges  = calcularBadges({
    total_viajes: user.total_viajes,
    calificacion_promedio: Number(user.calificacion_promedio),
    nivel_confianza: user.nivel_confianza,
  })

  const ratings = (calificaciones ?? []) as unknown as (DbCalificacion & { de_user: { nombre: string } })[]
  const autos   = (vehiculos ?? []) as DbVehiculo[]
  const sector  = user.sector ?? (ultimoViaje as any)?.origen ?? null

  const dist = [5,4,3,2,1].map(s => ({
    stars: s,
    count: ratings.filter(r => r.estrellas === s).length,
    pct: ratings.length ? Math.round(ratings.filter(r => r.estrellas === s).length / ratings.length * 100) : 0,
  }))

  const inicial = user.nombre?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="page-container">
      <div className="flex items-center gap-3 pt-2 mb-5">
        <Link href="/home" className="btn-ghost p-2 -ml-2"><ArrowLeft size={20} /></Link>
        <h1 className="text-lg font-bold text-ink-primary">Perfil del chofer</h1>
      </div>

      {/* Hero */}
      <div className="card p-6 mb-4 text-center">
        {/* Avatar con foto */}
        <div className="w-24 h-24 rounded-full overflow-hidden bg-brand/20 flex items-center justify-center mx-auto mb-3">
          {user.foto_url
            ? <img src={user.foto_url} alt={user.nombre} className="w-full h-full object-cover" />
            : <span className="text-4xl font-bold text-brand">{inicial}</span>
          }
        </div>

        <h2 className="text-xl font-bold text-ink-primary">{user.nombre || 'Sin nombre'}</h2>

        {/* Sector */}
        {sector && (
          <div className="flex items-center justify-center gap-1 mt-1.5 text-ink-muted">
            <MapPin size={12} />
            <span className="text-xs">{sector}</span>
          </div>
        )}

        {user.calificacion_promedio > 0 && (
          <div className="flex items-center justify-center gap-1 mt-2">
            <Star size={16} className="text-warning fill-warning" />
            <span className="text-lg font-bold text-ink-primary">{Number(user.calificacion_promedio).toFixed(2)}</span>
            <span className="text-ink-muted text-sm">({ratings.length} reseñas)</span>
          </div>
        )}

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
        <StatCard value={user.total_viajes}       label="Total viajes"   icon="🚗" />
        <StatCard value={viajesComoChofer ?? 0}   label="Como chofer"    icon="🏎️" />
        <StatCard value={viajesComoPasajero ?? 0} label="Como pasajero"  icon="🎫" />
      </div>

      {/* Vehículos */}
      {autos.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Vehículo</p>
          <div className="space-y-3">
            {autos.map(v => (
              <div key={v.id} className="card overflow-hidden">
                {v.foto_url && (
                  <img src={v.foto_url} alt={`${v.marca} ${v.modelo}`} className="w-full h-36 object-cover" />
                )}
                <div className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-surface-overlay flex items-center justify-center shrink-0">
                    <Car size={18} className="text-ink-muted" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink-primary text-sm">{v.marca} {v.modelo}</p>
                    <p className="text-xs text-ink-muted">{v.color} · {v.patente}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rating distribution */}
      {ratings.length > 0 && (
        <div className="card p-4 mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-4">Distribución</p>
          <div className="space-y-2">
            {dist.map(({ stars, count, pct }) => (
              <div key={stars} className="flex items-center gap-2">
                <span className="text-xs text-ink-secondary w-6">{stars}★</span>
                <div className="flex-1 h-2 bg-surface-overlay rounded-full overflow-hidden">
                  <div className="h-full bg-warning rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-ink-muted w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reseñas */}
      {ratings.length > 0 ? (
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
      ) : (
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
