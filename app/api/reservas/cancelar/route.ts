import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

export async function POST(req: Request) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { reservaId } = await req.json()
  if (!reservaId) return NextResponse.json({ error: 'Falta reservaId' }, { status: 400 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Obtener la reserva verificando que pertenece al usuario
  const { data: reserva } = await supabase
    .from('reservas')
    .select('id, viaje_id, viaje:viajes(id, origen, destino, fecha_hora, chofer_id, estado, cupos_disponibles)')
    .eq('id', reservaId)
    .eq('pasajero_id', user.id)
    .single()

  if (!reserva) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const viaje = reserva.viaje as any

  // No se puede cancelar si el viaje ya está en curso o terminado
  if (['en_camino', 'en_destino', 'finalizado', 'cancelado'].includes(viaje?.estado)) {
    return NextResponse.json({ error: 'No puedes cancelar durante un viaje en curso' }, { status: 409 })
  }

  // Eliminar la reserva
  const { error: deleteError } = await supabase
    .from('reservas')
    .delete()
    .eq('id', reservaId)

  if (deleteError) return NextResponse.json({ error: 'No se pudo cancelar' }, { status: 500 })

  // Devolver el cupo al viaje
  await supabase
    .from('viajes')
    .update({ cupos_disponibles: (viaje.cupos_disponibles ?? 0) + 1 })
    .eq('id', viaje.id)

  // Notificar al chofer
  const { data: pasajero } = await supabase
    .from('users')
    .select('nombre')
    .eq('id', user.id)
    .single()

  const nombrePasajero = pasajero?.nombre || 'Un pasajero'
  const resumen = `${viaje.origen} → ${viaje.destino} · ${formatDateTime(viaje.fecha_hora)}`

  await supabase.from('notificaciones').insert({
    user_id: viaje.chofer_id,
    tipo: 'reserva_cancelada',
    titulo: `❌ ${nombrePasajero} canceló su reserva`,
    mensaje: resumen,
    leido: false,
  })

  return NextResponse.json({ ok: true })
}
