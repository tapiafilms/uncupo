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
      className="flex items-center gap-1.5 text-xs text-ink-secondary hover:text-brand transition-colors px-1 py-1"
    >
      {copied
        ? <><Check size={13} className="text-success" /><span className="text-success">¡Copiado!</span></>
        : <><Share2 size={13} /><span>Compartir</span></>
      }
    </button>
  )
}
