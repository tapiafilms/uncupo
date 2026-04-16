import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime } from '@/lib/utils'

export async function POST(req: Request) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { viajeId } = await req.json()
  if (!viajeId) return NextResponse.json({ error: 'Falta viajeId' }, { status: 400 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar que el viaje pertenece al chofer
  const { data: viaje } = await supabase
    .from('viajes')
    .select('id, chofer_id, origen, destino, fecha_hora, estado')
    .eq('id', viajeId)
    .single()

  if (!viaje) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
  if (viaje.chofer_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (['finalizado', 'cancelado'].includes(viaje.estado)) {
    return NextResponse.json({ error: 'El viaje ya está finalizado o cancelado' }, { status: 409 })
  }

  // Obtener todos los pasajeros con reserva activa
  const { data: reservas } = await supabase
    .from('reservas')
    .select('id, pasajero_id')
    .eq('viaje_id', viajeId)

  const resumen = `${viaje.origen} → ${viaje.destino} · ${formatDateTime(viaje.fecha_hora)}`

  // Cancelar el viaje
  await supabase
    .from('viajes')
    .update({ estado: 'cancelado' })
    .eq('id', viajeId)

  // Notificar a cada pasajero
  if (reservas && reservas.length > 0) {
    const notificaciones = reservas.map((r) => ({
      user_id: r.pasajero_id,
      tipo: 'reserva_cancelada' as const,
      titulo: '❌ Viaje cancelado',
      mensaje: `El chofer canceló el viaje ${resumen}. Tu cupo fue liberado.`,
      leido: false,
    }))

    await supabase.from('notificaciones').insert(notificaciones)

    // Push notifications
    if (process.env.VAPID_PRIVATE_KEY) {
      const pasajeroIds = reservas.map((r) => r.pasajero_id)
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', pasajeroIds)

      if (subs && subs.length > 0) {
        const { sendPushNotification } = await import('@/lib/webpush')
        await Promise.all(
          subs.map((sub) =>
            sendPushNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              {
                title: '❌ Viaje cancelado',
                body: resumen,
                url: '/home',
                tag: `cancelado-${viajeId}`,
              }
            )
          )
        )
      }
    }
  }

  return NextResponse.json({ ok: true })
}
