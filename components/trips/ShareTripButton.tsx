'use client'

import { Share2, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { ViajeConChofer } from '@/lib/types'
import { formatRelativeDay, formatTime, formatPrice } from '@/lib/utils'

interface ShareTripButtonProps {
  viaje: ViajeConChofer
}

export function ShareTripButton({ viaje }: ShareTripButtonProps) {
  const [copied, setCopied] = useState(false)

  const url  = `${window.location.origin}/viajes/${viaje.id}`
  const text = `🚗 Viaje disponible en UNcupo\n${viaje.origen} → ${viaje.destino}\n📅 ${formatRelativeDay(viaje.fecha_hora)} a las ${formatTime(viaje.fecha_hora)}\n💰 ${formatPrice(viaje.precio_cupo)} por cupo`

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'UNcupo — Viaje disponible', text, url })
      } catch {
        // usuario canceló, no hacer nada
      }
    } else {
      await navigator.clipboard.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 bg-brand/10 text-brand hover:bg-brand/20"
    >
      {copied
        ? <><Check size={12} /><span>¡Copiado!</span></>
        : <><Share2 size={12} /><span>Compartir</span></>
      }
    </button>
  )
}
