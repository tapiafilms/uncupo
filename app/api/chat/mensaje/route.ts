import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  // 1. Autenticar al remitente
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { reservaId, texto } = await req.json()
  if (!reservaId || !texto?.trim()) {
    return NextResponse.json({ error: 'Faltan campos' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 2. Obtener la reserva con participantes
  const { data: reserva } = await supabase
    .from('reservas')
    .select(`
      id,
      pasajero_id,
      pasajero:users!reservas_pasajero_id_fkey(id, nombre),
      viaje:viajes!reservas_viaje_id_fkey(
        id, origen, destino, chofer_id,
        chofer:users!viajes_chofer_id_fkey(id, nombre)
      )
    `)
    .eq('id', reservaId)
    .single()

  if (!reserva) return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 })

  const viaje     = reserva.viaje as any
  const chofer    = viaje?.chofer as { id: string; nombre: string }
  const pasajero  = reserva.pasajero as unknown as { id: string; nombre: string }

  // Solo participantes pueden escribir
  const esChofer   = user.id === viaje?.chofer_id
  const esPasajero = user.id === reserva.pasajero_id
  if (!esChofer && !esPasajero) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // 3. Insertar mensaje
  const { data: mensaje, error: msgError } = await supabase
    .from('mensajes')
    .insert({ reserva_id: reservaId, de_user_id: user.id, texto: texto.trim() })
    .select('id, de_user_id, texto, creado_en')
    .single()

  if (msgError) return NextResponse.json({ error: 'No se pudo enviar' }, { status: 500 })

  // 4. Determinar destinatario
  const destinatarioId   = esChofer ? reserva.pasajero_id : viaje.chofer_id
  const nombreRemitente  = esChofer ? chofer.nombre : pasajero.nombre
  const ruta             = `${viaje.origen} → ${viaje.destino}`

  // 5. Notificación in-app
  await supabase.from('notificaciones').insert({
    user_id: destinatarioId,
    tipo: 'nuevo_mensaje',
    titulo: `💬 ${nombreRemitente}`,
    mensaje: texto.trim().length > 60 ? texto.trim().slice(0, 57) + '…' : texto.trim(),
    leido: false,
  })

  // 6. Push notification
  if (process.env.VAPID_PRIVATE_KEY) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', destinatarioId)

    if (subs && subs.length > 0) {
      const { sendPushNotification } = await import('@/lib/webpush')
      await Promise.all(
        subs.map((sub) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            {
              title: `💬 ${nombreRemitente}`,
              body: texto.trim().length > 80 ? texto.trim().slice(0, 77) + '…' : texto.trim(),
              url: `/chat/${reservaId}`,
              tag: `chat-${reservaId}`,
            }
          )
        )
      )
    }
  }

  return NextResponse.json({ ok: true, mensaje })
}
