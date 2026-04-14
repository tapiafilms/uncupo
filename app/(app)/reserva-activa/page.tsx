export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PassengerTripView } from './PassengerTripView'

export default async function ReservaActivaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Find passenger's active reservation
  const { data: reserva } = await supabase
    .from('reservas')
    .select(`
      *,
      viaje:viajes(
        *,
        chofer:users!viajes_chofer_id_fkey(*),
        vehiculo:vehiculos(*)
      )
    `)
    .eq('pasajero_id', user.id)
    .not('estado_pasajero', 'in', '("pago_confirmado")')
    .not('viaje.estado', 'in', '("finalizado","cancelado")')
    .order('creado_en', { ascending: false })
    .limit(1)
    .single()

  if (!reserva || !reserva.viaje) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-5xl mb-4">🎫</span>
        <p className="text-ink-primary font-semibold text-lg">Sin reserva activa</p>
        <p className="text-ink-muted text-sm mt-1 mb-6">No tienes ningún viaje reservado</p>
        <a href="/home" className="btn-primary">Buscar viajes</a>
      </div>
    )
  }

  return (
    <PassengerTripView
      reservaId={reserva.id}
      reservaInicial={reserva as any}
      pasajeroId={user.id}
    />
  )
}
