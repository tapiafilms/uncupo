import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { formatDateTime, formatPrice } from '@/lib/utils'

export async function POST(req: Request) {
  // 1. Autenticar al pasajero
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { viajeId } = await req.json()
  if (!viajeId) return NextResponse.json({ error: 'Falta viajeId' }, { status: 400 })

  // 2. Service-role client para operaciones privilegiadas
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 3. Obtener datos del viaje + chofer
  const { data: viaje } = await supabase
    .from('viajes')
    .select('*, chofer:users!viajes_chofer_id_fkey(id, nombre)')
    .eq('id', viajeId)
    .single()

  if (!viaje) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
  if (viaje.cupos_disponibles <= 0) {
    return NextResponse.json({ error: 'Sin cupos disponibles' }, { status: 409 })
  }

  // 4. Obtener perfil del pasajero
  const { data: pasajero } = await supabase
    .from('users')
    .select('nombre')
    .eq('id', user.id)
    .single()

  const nombrePasajero = pasajero?.nombre || 'Un pasajero'

  // 5. Crear la reserva
  const { data: reservaData, error: reservaError } = await supabase
    .from('reservas')
    .insert({
      viaje_id: viajeId,
      pasajero_id: user.id,
      estado_pasajero: 'reservado',
      pago_confirmado: false,
    })
    .select('id')
    .single()

  if (reservaError) {
    if (reservaError.message?.includes('horario')) {
      return NextResponse.json({ error: 'Ya tienes otro viaje reservado en ese horario.' }, { status: 409 })
    }
    if (reservaError.code === '23505') {
      return NextResponse.json({ error: 'Ya tienes una reserva en este viaje.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'No se pudo reservar.' }, { status: 500 })
  }

  // 5b. Insertar saludo automático del chofer en el chat
  const nombreChofer = (viaje.chofer as { nombre: string })?.nombre || 'El chofer'
  if (reservaData?.id) {
    await supabase.from('mensajes').insert({
      reserva_id: reservaData.id,
      de_user_id: viaje.chofer_id,
      texto: `Hola, soy ${nombreChofer}. Gracias por preferirme, ¿me confirmas tu cupo?`,
    })
  }

  // 6. Notificación in-app al chofer
  const resumen = `${viaje.origen} → ${viaje.destino} · ${formatDateTime(viaje.fecha_hora)}`
  await supabase.from('notificaciones').insert({
    user_id: viaje.chofer_id,
    tipo: 'nueva_reserva',
    titulo: `🎫 ${nombrePasajero} quiere un cupo`,
    mensaje: `${resumen} — Entra a confirmarle el viaje`,
    leido: false,
  })

  // 7. Push notification al chofer (si tiene suscripción activa)
  if (process.env.VAPID_PRIVATE_KEY) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', viaje.chofer_id)

    if (subs && subs.length > 0) {
      const { sendPushNotification } = await import('@/lib/webpush')
      await Promise.all(
        subs.map((sub) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            {
              title: `🎫 ${nombrePasajero} quiere un cupo`,
              body: `${resumen} — Toca para confirmarle`,
              url: `/viaje-activo`,
              tag: `reserva-${viajeId}`,
            }
          )
        )
      )
    }
  }

  return NextResponse.json({ ok: true, reservaId: reservaData?.id })
}
