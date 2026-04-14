import { createClient } from '@/lib/supabase/server'

export default async function MisViajesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch trips where user is driver
  const { data: viajesComoChofer } = await supabase
    .from('viajes')
    .select('*')
    .eq('chofer_id', user!.id)
    .order('fecha_hora', { ascending: false })
    .limit(10)

  // Fetch trips where user is passenger
  const { data: reservas } = await supabase
    .from('reservas')
    .select('*, viaje:viajes(*)')
    .eq('pasajero_id', user!.id)
    .order('creado_en', { ascending: false })
    .limit(10)

  return (
    <div className="page-container">
      <h1 className="text-2xl font-bold text-ink-primary mb-6 pt-2">Mis Viajes</h1>

      {/* As driver */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider mb-3">
          Como Chofer
        </h2>
        {!viajesComoChofer?.length ? (
          <div className="card p-6 text-center">
            <p className="text-ink-muted text-sm">No has publicado viajes aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {viajesComoChofer.map((v) => (
              <a key={v.id} href={`/viajes/${v.id}`} className="card block p-4">
                <p className="text-sm font-medium text-ink-primary">
                  {v.origen} → {v.destino}
                </p>
                <p className="text-xs text-ink-secondary mt-1">{v.fecha_hora}</p>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* As passenger */}
      <section>
        <h2 className="text-sm font-semibold text-ink-secondary uppercase tracking-wider mb-3">
          Como Pasajero
        </h2>
        {!reservas?.length ? (
          <div className="card p-6 text-center">
            <p className="text-ink-muted text-sm">No tienes reservas aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reservas.map((r) => (
              <a key={r.id} href={`/viajes/${r.viaje_id}`} className="card block p-4">
                <p className="text-sm font-medium text-ink-primary">
                  {(r.viaje as any)?.origen} → {(r.viaje as any)?.destino}
                </p>
                <p className="text-xs text-ink-secondary mt-1 capitalize">{r.estado_pasajero}</p>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
