export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { ChatMessages } from './ChatMessages'

interface PageProps {
  params: Promise<{ reservaId: string }>
}

export default async function ChatPage({ params }: PageProps) {
  const { reservaId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch reserva con viaje y ambos participantes
  const { data: reserva } = await supabase
    .from('reservas')
    .select(`
      id,
      pasajero_id,
      pasajero:users!reservas_pasajero_id_fkey(id, nombre),
      viaje:viajes!reservas_viaje_id_fkey(
        id, origen, destino, estado,
        chofer:users!viajes_chofer_id_fkey(id, nombre)
      )
    `)
    .eq('id', reservaId)
    .single()

  if (!reserva || !reserva.viaje) notFound()

  const viaje = reserva.viaje as any
  const chofer = viaje.chofer as { id: string; nombre: string }
  const pasajero = (reserva.pasajero as unknown) as { id: string; nombre: string }

  // Solo participantes pueden entrar
  const esChofer = user.id === chofer.id
  const esPasajero = user.id === reserva.pasajero_id
  if (!esChofer && !esPasajero) redirect('/home')

  // Interlocutor
  const otroNombre = esChofer ? pasajero.nombre : chofer.nombre

  // Mensajes iniciales
  const { data: mensajesIniciales } = await supabase
    .from('mensajes')
    .select('id, de_user_id, texto, creado_en')
    .eq('reserva_id', reservaId)
    .order('creado_en', { ascending: true })

  const backUrl = esChofer ? '/viaje-activo' : `/viajes/${viaje.id}`

  return (
    <div className="flex flex-col h-dvh bg-surface-base">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-safe pb-3 pt-4 border-b border-surface-border bg-surface-overlay shrink-0">
        <Link href={backUrl} className="btn-ghost p-2 -ml-2">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ink-primary truncate">{otroNombre}</p>
          <p className="text-xs text-ink-muted truncate">
            {viaje.origen} → {viaje.destino}
          </p>
        </div>
      </div>

      {/* Chat */}
      <ChatMessages
        reservaId={reservaId}
        userId={user.id}
        mensajesIniciales={mensajesIniciales ?? []}
        viajeEstado={viaje.estado}
      />
    </div>
  )
}
