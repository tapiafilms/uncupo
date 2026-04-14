import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LogoutButton } from '@/components/auth/LogoutButton'
import { Star, Car, User } from 'lucide-react'
import type { DbUser } from '@/lib/types'

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

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-2xl font-bold text-ink-primary">Perfil</h1>
        <LogoutButton />
      </div>

      {/* Avatar + name */}
      <div className="card p-6 flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center text-2xl shrink-0">
          {p?.nombre?.[0]?.toUpperCase() ?? <User size={28} className="text-brand" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-primary text-lg truncate">
            {p?.nombre || 'Sin nombre'}
          </p>
          <p className="text-sm text-ink-secondary">{p?.telefono ?? user.phone}</p>
          {p != null && p.calificacion_promedio > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <Star size={12} className="text-warning fill-warning" />
              <span className="text-xs text-ink-secondary">
                {p.calificacion_promedio.toFixed(1)} · {p.total_viajes} viajes
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: 'Viajes', value: p?.total_viajes ?? 0, icon: Car },
          { label: 'Calificación', value: p?.calificacion_promedio?.toFixed(1) ?? '—', icon: Star },
          { label: 'Nivel', value: p?.nivel_confianza ?? 1, icon: User },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card p-3 text-center">
            <Icon size={16} className="text-brand mx-auto mb-1" />
            <p className="text-lg font-bold text-ink-primary">{value}</p>
            <p className="text-xs text-ink-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <a href="/alertas" className="card p-4 mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-ink-primary">🔔 Mis alertas de viaje</p>
          <p className="text-xs text-ink-muted mt-0.5">Recibe aviso cuando salga un viaje</p>
        </div>
        <span className="text-ink-muted text-lg">›</span>
      </a>

      {/* Placeholder sections */}
      <div className="card p-4 mb-3">
        <p className="text-sm font-medium text-ink-secondary">Editar perfil</p>
        <p className="text-xs text-ink-muted mt-0.5">Próximamente — Fase 5</p>
      </div>
      <div className="card p-4 mb-3">
        <p className="text-sm font-medium text-ink-secondary">Mi vehículo</p>
        <p className="text-xs text-ink-muted mt-0.5">Próximamente — Fase 5</p>
      </div>
    </div>
  )
}
