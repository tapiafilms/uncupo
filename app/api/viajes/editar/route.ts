import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabaseUser = await createClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { viajeId, fecha, hora, precio, cupos, notas } = await req.json()
  if (!viajeId) return NextResponse.json({ error: 'Falta viajeId' }, { status: 400 })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Verificar que el viaje pertenece al chofer y está en estado editable
  const { data: viaje } = await supabase
    .from('viajes')
    .select('id, chofer_id, estado, cupos_total, cupos_disponibles')
    .eq('id', viajeId)
    .single()

  if (!viaje) return NextResponse.json({ error: 'Viaje no encontrado' }, { status: 404 })
  if (viaje.chofer_id !== user.id) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  if (!['publicado', 'confirmado'].includes(viaje.estado)) {
    return NextResponse.json({ error: 'Este viaje ya no se puede editar' }, { status: 409 })
  }

  // Cupos: no puede bajar de los ya reservados
  const reservados = viaje.cupos_total - viaje.cupos_disponibles
  if (cupos < reservados) {
    return NextResponse.json({
      error: `No puedes bajar los cupos a ${cupos} — ya tienes ${reservados} pasajero${reservados !== 1 ? 's' : ''} reservado${reservados !== 1 ? 's' : ''}`
    }, { status: 409 })
  }

  const fechaHora = new Date(`${fecha}T${hora}:00`)

  const { error: updateError } = await supabase
    .from('viajes')
    .update({
      fecha_hora:         fechaHora.toISOString(),
      precio_cupo:        precio,
      cupos_total:        cupos,
      cupos_disponibles:  cupos - reservados,
      notas:              notas || null,
    })
    .eq('id', viajeId)

  if (updateError) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })

  // Notificar a pasajeros si hay reservas activas
  if (reservados > 0) {
    const { data: reservas } = await supabase
      .from('reservas')
      .select('pasajero_id')
      .eq('viaje_id', viajeId)

    if (reservas && reservas.length > 0) {
      const notifs = reservas.map((r) => ({
        user_id: r.pasajero_id,
        tipo: 'nueva_alerta',
        titulo: '✏️ Viaje actualizado',
        mensaje: `El chofer modificó los detalles del viaje. Nueva hora: ${hora}`,
        leido: false,
      }))
      await supabase.from('notificaciones').insert(notifs)
    }
  }

  return NextResponse.json({ ok: true })
}
