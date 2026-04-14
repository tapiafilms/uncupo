import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { formatDateTime } from '@/lib/utils'

const anthropic = new Anthropic()

export async function POST(req: Request) {
  const { viajeId } = await req.json()
  if (!viajeId) return NextResponse.json({ error: 'Missing viajeId' }, { status: 400 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch the trip
  const { data: viaje } = await supabase
    .from('viajes')
    .select('*')
    .eq('id', viajeId)
    .single()

  if (!viaje) return NextResponse.json({ error: 'Viaje not found' }, { status: 404 })

  // Fetch all active alerts
  const { data: alertas } = await supabase
    .from('alertas')
    .select('*, pasajero:users!alertas_pasajero_id_fkey(id, nombre)')
    .eq('activa', true)

  if (!alertas || alertas.length === 0) {
    return NextResponse.json({ matched: 0 })
  }

  // Use Claude to evaluate which alerts match
  const alertasJson = alertas.map((a) => ({
    id: a.id,
    pasajero_id: a.pasajero_id,
    origen: a.origen,
    destino: a.destino,
    fecha_min: a.fecha_min,
    fecha_max: a.fecha_max,
    hora_min: a.hora_min,
    hora_max: a.hora_max,
    precio_max: a.precio_max,
  }))

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: `Eres un sistema de matching de viajes compartidos entre Viña del Mar y Santiago de Chile.
Tu tarea es determinar qué alertas de pasajeros son compatibles con un viaje publicado.

Criterios de matching (todos deben cumplirse):
1. El origen del viaje debe ser compatible con el origen de la alerta (misma zona o cercano)
2. El destino del viaje debe ser compatible con el destino de la alerta
3. La fecha/hora del viaje debe estar dentro del rango de la alerta (si se especificó)
4. El precio del viaje debe ser <= precio_max de la alerta (si se especificó)

Responde ÚNICAMENTE con JSON válido, array de IDs de alertas que hacen match:
{ "matches": ["id1", "id2"] }`,
    messages: [{
      role: 'user',
      content: `Viaje publicado:
- Origen: ${viaje.origen}
- Destino: ${viaje.destino}
- Fecha/hora: ${formatDateTime(viaje.fecha_hora)}
- Precio: $${viaje.precio_cupo}
- Cupos: ${viaje.cupos_disponibles}

Alertas activas:
${JSON.stringify(alertasJson, null, 2)}`
    }],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : '{}'
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  let matchedIds: string[] = []

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0])
      matchedIds = parsed.matches ?? []
    } catch { /* ignore */ }
  }

  if (matchedIds.length === 0) return NextResponse.json({ matched: 0 })

  // Create in-app notifications + push for each matched alert
  const matchedAlertas = alertas.filter((a) => matchedIds.includes(a.id))
  let notified = 0

  await Promise.all(matchedAlertas.map(async (alerta) => {
    // 1. In-app notification
    await supabase.from('notificaciones').insert({
      user_id: alerta.pasajero_id,
      tipo: 'nueva_alerta',
      titulo: '🚗 Nuevo viaje que te interesa',
      mensaje: `${viaje.origen} → ${viaje.destino} · ${formatDateTime(viaje.fecha_hora)} · $${viaje.precio_cupo.toLocaleString('es-CL')}`,
      leido: false,
    })

    // 2. Web Push (if VAPID keys configured)
    if (process.env.VAPID_PRIVATE_KEY) {
      const { data: subs } = await supabase
        .from('push_subscriptions')
        .select('*')
        .eq('user_id', alerta.pasajero_id)

      if (subs && subs.length > 0) {
        const { sendPushNotification } = await import('@/lib/webpush')
        await Promise.all(subs.map((sub) =>
          sendPushNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            {
              title: '🚗 Nuevo viaje disponible',
              body: `${viaje.origen} → ${viaje.destino} · ${formatDateTime(viaje.fecha_hora)}`,
              url: `/viajes/${viajeId}`,
              tag: `viaje-${viajeId}`,
            }
          )
        ))
      }
    }

    notified++
  }))

  return NextResponse.json({ matched: matchedIds.length, notified })
}
