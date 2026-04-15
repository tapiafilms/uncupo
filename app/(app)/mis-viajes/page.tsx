export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { TripCard } from '@/components/trips/TripCard'
import { AppHeader } from '@/components/layout/AppHeader'
import type { ViajeConChofer } from '@/lib/types'

export default async function MisViajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Trips as driver
  const { data: viajesChofer } = await supabase
    .from('viajes')
    .select(`*, chofer:users!viajes_chofer_id_fkey(*), vehiculo:vehiculos(*)`)
    .eq('chofer_id', user!.id)
    .order('fecha_hora', { ascending: false })
    .limit(20)

  // Trips as passenger (via reservas)
  const { data: reservas } = await supabase
    .from('reservas')
    .select(`*, viaje:viajes(*, chofer:users!viajes_chofer_id_fkey(*), vehiculo:vehiculos(*))`)
    .eq('pasajero_id', user!.id)
    .order('creado_en', { ascending: false })
    .limit(20)

  const tripsChofer = (viajesChofer ?? []) as unknown as ViajeConChofer[]
  const tripsPasajero = (reservas ?? []).map((r: any) => r.viaje) as ViajeConChofer[]

  const activosChofer   = tripsChofer.filter(v => !['finalizado', 'cancelado'].includes(v.estado))
  const pasadosChofer   = tripsChofer.filter(v =>  ['finalizado', 'cancelado'].includes(v.estado))
  const activosPasajero = tripsPasajero.filter(v => !['finalizado', 'cancelado'].includes(v?.estado))
  const pasadosPasajero = tripsPasajero.filter(v =>  ['finalizado', 'cancelado'].includes(v?.estado))

  // Check for in-progress trips to show shortcut banners
  const viajeEnCurso = activosChofer.find(v => ['en_camino', 'en_destino', 'confirmado'].includes(v.estado))
  const reservaEnCurso = reservas?.find((r: any) =>
    !['pago_confirmado'].includes(r.estado_pasajero) &&
    !['finalizado', 'cancelado'].includes(r.viaje?.estado)
  )

  return (
    <div className="page-container">
      <AppHeader />
      <h1 className="text-xl font-bold text-ink-primary mb-5">Mis Viajes</h1>

      {/* Shortcut — active trip (driver) */}
      {viajeEnCurso && (
        <a href="/viaje-activo" className="flex items-center gap-3 bg-brand/10 border border-brand/30 rounded-2xl p-4 mb-5 animate-pulse-dot">
          <span className="text-2xl">🚗</span>
          <div className="flex-1">
            <p className="text-brand font-bold text-sm">Viaje en curso</p>
            <p className="text-brand/70 text-xs">{viajeEnCurso.origen} → {viajeEnCurso.destino}</p>
          </div>
          <span className="text-brand text-xs font-semibold">Ver →</span>
        </a>
      )}

      {/* Shortcut — active reservation (passenger) */}
      {reservaEnCurso && (
        <a href="/reserva-activa" className="flex items-center gap-3 bg-success/10 border border-success/30 rounded-2xl p-4 mb-5 animate-pulse-dot">
          <span className="text-2xl">🎫</span>
          <div className="flex-1">
            <p className="text-success font-bold text-sm">Reserva activa</p>
            <p className="text-success/70 text-xs capitalize">{(reservaEnCurso as any).estado_pasajero?.replace('_', ' ')}</p>
          </div>
          <span className="text-success text-xs font-semibold">Ver →</span>
        </a>
      )}

      {/* --- CHOFER --- */}
      <Section title="🚗 Como Chofer — Activos">
        {activosChofer.length === 0
          ? <Empty text="No tienes viajes activos publicados" cta={{ href: '/publicar', label: '+ Publicar viaje' }} />
          : activosChofer.map(v => <TripCard key={v.id} viaje={v} />)
        }
      </Section>

      {/* --- PASAJERO --- */}
      <Section title="🎫 Como Pasajero — Activos">
        {activosPasajero.length === 0
          ? <Empty text="No tienes reservas activas" cta={{ href: '/home', label: 'Buscar viajes' }} />
          : activosPasajero.filter(Boolean).map(v => <TripCard key={v.id} viaje={v} />)
        }
      </Section>

      {/* Historial */}
      {(pasadosChofer.length > 0 || pasadosPasajero.length > 0) && (
        <Section title="📁 Historial">
          {[...pasadosChofer, ...pasadosPasajero].filter(Boolean).map(v => (
            <TripCard key={v.id} viaje={v} compact />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Empty({ text, cta }: { text: string; cta?: { href: string; label: string } }) {
  return (
    <div className="card p-5 text-center">
      <p className="text-ink-muted text-sm">{text}</p>
      {cta && (
        <a href={cta.href} className="inline-block mt-3 text-brand text-sm font-semibold">
          {cta.label}
        </a>
      )}
    </div>
  )
}
