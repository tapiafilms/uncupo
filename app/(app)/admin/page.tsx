export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { AppHeader } from '@/components/layout/AppHeader'
import { Users, Car, BookCheck, TrendingUp } from 'lucide-react'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Protección: solo el email de admin puede entrar
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || user.email !== adminEmail) redirect('/home')

  const service = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const [
    { count: totalUsuarios },
    { count: totalViajes },
    { count: viajesActivos },
    { count: totalReservas },
    { count: reservasActivas },
    { data: viajesRecientes },
    { data: usuariosRecientes },
  ] = await Promise.all([
    service.from('users').select('*', { count: 'exact', head: true }),
    service.from('viajes').select('*', { count: 'exact', head: true }),
    service.from('viajes').select('*', { count: 'exact', head: true }).in('estado', ['publicado', 'confirmado', 'en_camino']),
    service.from('reservas').select('*', { count: 'exact', head: true }),
    service.from('reservas').select('*', { count: 'exact', head: true }).not('estado_pasajero', 'eq', 'pago_confirmado'),
    service.from('viajes')
      .select('id, origen, destino, fecha_hora, estado, cupos_disponibles, cupos_total, chofer:users!viajes_chofer_id_fkey(nombre)')
      .order('creado_en', { ascending: false })
      .limit(10),
    service.from('users')
      .select('id, nombre, email:id, creado_en, total_viajes, calificacion_promedio')
      .order('creado_en', { ascending: false })
      .limit(10),
  ])

  const ESTADO_COLORS: Record<string, string> = {
    publicado:  'text-info bg-info/10',
    confirmado: 'text-success bg-success/10',
    en_camino:  'text-warning bg-warning/10',
    finalizado: 'text-ink-muted bg-surface-overlay',
    cancelado:  'text-danger bg-danger/10',
  }

  return (
    <div className="page-container">
      <AppHeader />
      <h1 className="text-xl font-bold text-ink-primary mb-1">Admin</h1>
      <p className="text-xs text-ink-muted mb-5">Panel de métricas UNcupo</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={<Users size={18} className="text-brand" />}     value={totalUsuarios ?? 0}   label="Usuarios registrados" />
        <StatCard icon={<Car size={18} className="text-success" />}      value={viajesActivos ?? 0}   label="Viajes activos" />
        <StatCard icon={<BookCheck size={18} className="text-warning" />} value={reservasActivas ?? 0} label="Reservas activas" />
        <StatCard icon={<TrendingUp size={18} className="text-info" />}  value={totalViajes ?? 0}     label="Viajes publicados total" />
      </div>

      {/* Viajes recientes */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Últimos viajes</h2>
        <div className="space-y-2">
          {(viajesRecientes ?? []).map((v: any) => (
            <div key={v.id} className="card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-primary truncate">
                    {v.origen} → {v.destino}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {v.chofer?.nombre ?? '—'} · {new Date(v.fecha_hora).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-ink-muted">{v.cupos_total - v.cupos_disponibles}/{v.cupos_total}</span>
                  <span className={`badge text-[10px] ${ESTADO_COLORS[v.estado] ?? 'text-ink-muted bg-surface-overlay'}`}>
                    {v.estado}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Usuarios recientes */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">Últimos usuarios</h2>
        <div className="space-y-2">
          {(usuariosRecientes ?? []).map((u: any) => (
            <div key={u.id} className="card p-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-primary truncate">{u.nombre || 'Sin nombre'}</p>
                <p className="text-xs text-ink-muted">{new Date(u.creado_en).toLocaleDateString('es-CL')}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-ink-secondary">{u.total_viajes} viajes</p>
                {u.calificacion_promedio > 0 && (
                  <p className="text-xs text-warning">★ {Number(u.calificacion_promedio).toFixed(1)}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Totales rápidos */}
      <div className="card p-4 text-center">
        <p className="text-xs text-ink-muted mb-1">Total reservas históricas</p>
        <p className="text-3xl font-bold text-brand">{totalReservas ?? 0}</p>
      </div>
    </div>
  )
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-ink-primary">{value}</p>
      <p className="text-xs text-ink-muted mt-0.5 leading-tight">{label}</p>
    </div>
  )
}
