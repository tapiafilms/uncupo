import { RotateCcw } from 'lucide-react'
import type { ViajeConChofer } from '@/lib/types'
import Link from 'next/link'

interface Props {
  viaje: ViajeConChofer
}

export function RepeatTripButton({ viaje }: Props) {
  const params = new URLSearchParams({
    origen:     viaje.origen,
    destino:    viaje.destino,
    cupos:      String(viaje.cupos_total),
    precio:     String(viaje.precio_cupo),
    ...(viaje.notas        ? { notas: viaje.notas } : {}),
    ...(viaje.vehiculo_id  ? { vehiculoId: viaje.vehiculo_id } : {}),
  })

  return (
    <Link
      href={`/publicar?${params.toString()}`}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 bg-success/10 text-success hover:bg-success/20"
    >
      <RotateCcw size={12} />
      Repetir
    </Link>
  )
}
