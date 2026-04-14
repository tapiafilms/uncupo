export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { RatingForm } from './RatingForm'

interface PageProps {
  params: Promise<{ viajeId: string }>
}

export default async function CalificarPage({ params }: PageProps) {
  const { viajeId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch trip with participants
  const { data: viaje } = await supabase
    .from('viajes')
    .select(`
      *,
      chofer:users!viajes_chofer_id_fkey(*),
      reservas(*, pasajero:users!reservas_pasajero_id_fkey(*))
    `)
    .eq('id', viajeId)
    .eq('estado', 'finalizado')
    .single()

  if (!viaje) notFound()

  const isDriver = user.id === viaje.chofer_id
  const reservas = viaje.reservas ?? []

  // Check existing ratings
  const { data: yaCalifique } = await supabase
    .from('calificaciones')
    .select('a_user_id')
    .eq('viaje_id', viajeId)
    .eq('de_user_id', user.id)

  const yaCalificadosIds = (yaCalifique ?? []).map((c: any) => c.a_user_id)

  // Who to rate?
  let aCalificar: Array<{ id: string; nombre: string; rol: string }> = []

  if (isDriver) {
    // Driver rates each passenger
    aCalificar = reservas
      .filter((r: any) => r.pago_confirmado && !yaCalificadosIds.includes(r.pasajero_id))
      .map((r: any) => ({
        id: r.pasajero_id,
        nombre: r.pasajero?.nombre || 'Pasajero',
        rol: 'pasajero',
      }))
  } else {
    // Passenger rates driver (if not already rated)
    if (!yaCalificadosIds.includes(viaje.chofer_id)) {
      const reservaPropia = reservas.find((r: any) => r.pasajero_id === user.id)
      if (reservaPropia?.pago_confirmado) {
        aCalificar = [{ id: viaje.chofer_id, nombre: (viaje.chofer as any)?.nombre || 'Chofer', rol: 'chofer' }]
      }
    }
  }

  if (aCalificar.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-5xl mb-4">✅</span>
        <p className="text-ink-primary font-bold text-lg">Ya calificaste a todos</p>
        <p className="text-ink-muted text-sm mt-1 mb-6">¡Gracias por tu feedback!</p>
        <a href="/mis-viajes" className="btn-primary">Mis viajes</a>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Calificar viaje</h1>
        <p className="text-sm text-ink-secondary mt-1">
          {(viaje as any).origen} → {(viaje as any).destino}
        </p>
      </div>

      <RatingForm
        viajeId={viajeId}
        userId={user.id}
        personas={aCalificar}
      />
    </div>
  )
}
