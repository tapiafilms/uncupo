import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { evaluarCancelacion } from '@/lib/cancelaciones'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { reservaId } = await req.json()
  if (!reservaId) return NextResponse.json({ error: 'Missing reservaId' }, { status: 400 })

  // Fetch reservation + trip
  const { data: reserva } = await supabase
    .from('reservas')
    .select('*, viaje:viajes(*)')
    .eq('id', reservaId)
    .eq('pasajero_id', user.id)
    .single()

  if (!reserva) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const viaje = reserva.viaje as any

  // Evaluar política
  const resultado = evaluarCancelacion(viaje.fecha_hora)

  if (!resultado.permitido) {
    return NextResponse.json({ error: resultado.mensaje, tipo: resultado.tipo }, { status: 403 })
  }

  // Contar no-shows previos del usuario
  const { count: noShows } = await supabase
    .from('notificaciones')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('tipo', 'reserva_cancelada')
    .ilike('mensaje', '%no-show%')

  // Si es penalización, registrar notificación de advertencia
  if (resultado.tipo === 'penalizacion') {
    await supabase.from('notificaciones').insert({
      user_id: user.id,
      tipo: 'reserva_cancelada',
      titulo: '⚠️ Cancelación registrada como no-show',
      mensaje: `Cancelaste el viaje ${viaje.origen} → ${viaje.destino} con menos de 30 min de anticipación.`,
      leido: false,
    })

    // Check if 3rd no-show → suspensión
    if ((noShows ?? 0) >= 2) {
      await supabase.from('notificaciones').insert({
        user_id: user.id,
        tipo: 'reserva_cancelada',
        titulo: '🚫 Cuenta suspendida temporalmente',
        mensaje: 'Has acumulado 3 no-shows. Tu cuenta estará suspendida por 24 horas.',
        leido: false,
      })
    }
  } else if (resultado.tipo === 'advertencia') {
    await supabase.from('notificaciones').insert({
      user_id: user.id,
      tipo: 'reserva_cancelada',
      titulo: '⚠️ Cancelación tardía registrada',
      mensaje: `Cancelaste con poca anticipación el viaje ${viaje.origen} → ${viaje.destino}.`,
      leido: false,
    })
  }

  // Delete reservation (trigger restores cupo)
  await supabase.from('reservas').delete().eq('id', reservaId)

  // Notify driver
  await supabase.from('notificaciones').insert({
    user_id: viaje.chofer_id,
    tipo: 'reserva_cancelada',
    titulo: '❌ Pasajero canceló',
    mensaje: `Un pasajero canceló su cupo en el viaje ${viaje.origen} → ${viaje.destino}.`,
    leido: false,
  })

  return NextResponse.json({ ok: true, tipo: resultado.tipo, mensaje: resultado.mensaje })
}
