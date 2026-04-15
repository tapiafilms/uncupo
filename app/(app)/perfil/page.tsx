export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Star } from 'lucide-react'
import Link from 'next/link'
import type { DbUser } from '@/lib/types'
import { calcularBadges } from '@/lib/badges'
import { ProfileEditWrapper } from './ProfileEditWrapper'
import { AvatarUpload } from '@/components/ui/AvatarUpload'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const p = profile as DbUser | null

  // Recent ratings
  const { data: calificaciones } = await supabase
    .from('calificaciones')
    .select('*, de_user:users!calificaciones_de_user_id_fkey(nombre)')
    .eq('a_user_id', user.id)
    .order('creado_en', { ascending: false })
    .limit(5)

  // Trips as driver count
  const { count: viajesChofer } = await supabase
    .from('viajes')
    .select('*', { count: 'exact', head: true })
    .eq('chofer_id', user.id)
    .eq('estado', 'finalizado')

  // Pending ratings to give
  const { data: pendingRating } = await supabase
    .from('viajes')
    .select('id, origen, destino')
    .eq('estado', 'finalizado')
    .or(`chofer_id.eq.${user.id}`)
    .order('creado_en', { ascending: false })
    .limit(5)

  const badges = calcularBadges({
    total_viajes: p?.total_viajes ?? 0,
    calificacion_promedio: Number(p?.calificacion_promedio ?? 0),
    nivel_confianza: p?.nivel_confianza ?? 1,
  })

  const reviews = (calificaciones ?? []) as any[]

  return (
    <div className="page-container">
      <AppHeader right={<LogoutButton />} />
      <h1 className="text-xl font-bold text-ink-primary mb-5">Perfil</h1>

      {/* Avatar + name + edit */}
      <div className="card p-5 mb-4">
        <div className="flex items-start gap-4">
          <AvatarUpload
            userId={user.id}
            nombre={p?.nombre ?? ''}
            fotoUrl={p?.foto_url ?? null}
          />
          <div className="flex-1 min-w-0">
            <ProfileEditWrapper userId={user.id} nombre={p?.nombre ?? ''} />
            <p className="text-xs text-ink-muted mt-1">{user.email}</p>
            {p && Number(p.calificacion_promedio) > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <Star size={13} className="text-warning fill-warning" />
                <span className="text-sm font-semibold text-ink-primary">
                  {Number(p.calificacion_promedio).toFixed(2)}
                </span>
                <span className="text-xs text-ink-muted">({reviews.length} reseñas)</span>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-border">
            {badges.map(b => (
              <span key={b.id} className={`badge border text-xs font-semibold ${b.color}`} title={b.desc}>
                {b.emoji} {b.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card p-3 text-center">
          <p className="text-xl">🚗</p>
          <p className="text-xl font-bold text-ink-primary mt-1">{viajesChofer ?? 0}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Como chofer</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl">🎫</p>
          <p className="text-xl font-bold text-ink-primary mt-1">{p?.total_viajes ?? 0}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Total viajes</p>
        </div>
        <div className="card p-3 text-center">
          <p className="text-xl">🏅</p>
          <p className="text-xl font-bold text-ink-primary mt-1">{p?.nivel_confianza ?? 1}</p>
          <p className="text-[10px] text-ink-muted mt-0.5">Nivel</p>
        </div>
      </div>

      {/* Pending ratings */}
      {(pendingRating?.length ?? 0) > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">Pendiente calificar</p>
          {pendingRating!.map((v: any) => (
            <Link
              key={v.id}
              href={`/calificar/${v.id}`}
              className="card p-3 mb-2 flex items-center justify-between hover:border-brand/40"
            >
              <div>
                <p className="text-sm font-medium text-ink-primary">{v.origen} → {v.destino}</p>
                <p className="text-xs text-brand mt-0.5">⭐ Calificar ahora</p>
              </div>
              <span className="text-ink-muted">›</span>
            </Link>
          ))}
        </div>
      )}

      {/* Recent reviews */}
      {reviews.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Mis reseñas</p>
            <Link href={`/usuario/${user.id}`} className="text-xs text-brand">Ver todas</Link>
          </div>
          <div className="space-y-2">
            {reviews.slice(0, 3).map((r: any) => (
              <div key={r.id} className="card p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-medium text-ink-secondary">{r.de_user?.nombre ?? 'Usuario'}</p>
                  <div className="flex">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={10} className={s <= r.estrellas ? 'text-warning fill-warning' : 'text-surface-subtle'} />
                    ))}
                  </div>
                </div>
                {r.comentario && (
                  <p className="text-xs text-ink-secondary">"{r.comentario}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="space-y-2">
        <Link href="/alertas" className="card p-4 flex items-center justify-between hover:border-brand/40">
          <div>
            <p className="text-sm font-medium text-ink-primary">🔔 Mis alertas de viaje</p>
            <p className="text-xs text-ink-muted mt-0.5">Recibe aviso cuando salga un viaje</p>
          </div>
          <span className="text-ink-muted">›</span>
        </Link>
        <Link href={`/usuario/${user.id}`} className="card p-4 flex items-center justify-between hover:border-brand/40">
          <div>
            <p className="text-sm font-medium text-ink-primary">👤 Ver mi perfil público</p>
            <p className="text-xs text-ink-muted mt-0.5">Así te ven otros usuarios</p>
          </div>
          <span className="text-ink-muted">›</span>
        </Link>
        <Link href="/vehiculos" className="card p-4 flex items-center justify-between hover:border-brand/40">
          <div>
            <p className="text-sm font-medium text-ink-primary">🚗 Mis vehículos</p>
            <p className="text-xs text-ink-muted mt-0.5">Agrega o edita tu auto</p>
          </div>
          <span className="text-ink-muted">›</span>
        </Link>
      </div>
    </div>
  )
}
