import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

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

  const { data: viaje } = await supabase
    .from('viajes')
    .select('id, chofer_id, origen, destino, estado')
    .eq('id', viajeId)
    .single()

  if (!viaje || viaje.estado !== 'finalizado') {
    return NextResponse.json({ error: 'Viaje no finalizado' }, { status: 409 })
  }
  if (viaje.chofer_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Obtener todos los participantes (chofer + pasajeros)
  const { data: reservas } = await supabase
    .from('reservas')
    .select('pasajero_id')
    .eq('viaje_id', viajeId)

  const ruta = `${viaje.origen} → ${viaje.destino}`
  const participantes = [
    viaje.chofer_id,
    ...( reservas?.map(r => r.pasajero_id) ?? [])
  ]

  // Notificación in-app a todos
  const notifs = participantes.map(uid => ({
    user_id: uid,
    tipo: 'calificacion_recibida',
    titulo: '⭐ ¿Cómo estuvo el viaje?',
    mensaje: `Califica a tus compañeros de ${ruta}. Solo toma un momento.`,
    leido: false,
  }))
  await supabase.from('notificaciones').insert(notifs)

  // Push a todos
  if (process.env.VAPID_PRIVATE_KEY) {
    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', participantes)

    if (subs && subs.length > 0) {
      const { sendPushNotification } = await import('@/lib/webpush')
      await Promise.all(
        subs.map(sub =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            {
              title: '⭐ ¿Cómo estuvo el viaje?',
              body: `Califica a tus compañeros de ${ruta}`,
              url: `/calificar/${viajeId}`,
              tag: `calificar-${viajeId}`,
            }
          )
        )
      )
    }
  }

  return NextResponse.json({ ok: true })
}
