'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { TripCard } from '@/components/trips/TripCard'
import type { ViajeConChofer } from '@/lib/types'
import { cn } from '@/lib/utils'

export function HistorialAccordion({ viajes }: { viajes: ViajeConChofer[] }) {
  const [open, setOpen] = useState(false)

  if (viajes.length === 0) return null

  return (
    <section className="mb-6">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-1 group"
      >
        <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
          📁 Historial ({viajes.length})
        </h2>
        <ChevronDown
          size={15}
          className={cn(
            'text-ink-muted transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 mt-3 animate-slide-up">
          {viajes.map(v => (
            <div key={v.id} className="grayscale opacity-50 pointer-events-none select-none">
              <TripCard viaje={v} compact />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
