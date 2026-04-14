export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DriverTripView } from './DriverTripView'

export default async function ViajeActivoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find driver's active trip
  const { data: viaje } = await supabase
    .from('viajes')
    .select('id, origen, destino, fecha_hora, cupos_total, cupos_disponibles, precio_cupo, estado')
    .eq('chofer_id', user.id)
    .in('estado', ['publicado', 'confirmado', 'en_camino', 'en_destino'])
    .order('fecha_hora', { ascending: true })
    .limit(1)
    .single()

  if (!viaje) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-5xl mb-4">🚗</span>
        <p className="text-ink-primary font-semibold text-lg">Sin viaje activo</p>
        <p className="text-ink-muted text-sm mt-1 mb-6">No tienes ningún viaje en curso</p>
        <a href="/publicar" className="btn-primary">Publicar viaje</a>
      </div>
    )
  }

  // Fetch passengers with profiles
  const { data: reservas } = await supabase
    .from('reservas')
    .select('*, pasajero:users!reservas_pasajero_id_fkey(*)')
    .eq('viaje_id', viaje.id)

  return (
    <DriverTripView
      viajeId={viaje.id}
      viajeInicial={viaje as any}
      reservasIniciales={(reservas ?? []) as any}
      choferId={user.id}
    />
  )
}
