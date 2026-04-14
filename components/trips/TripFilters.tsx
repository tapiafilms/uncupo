'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { PUNTOS_VINA, ZONAS_SANTIAGO } from '@/lib/types'
import { cn } from '@/lib/utils'

const DIAS = [
  { key: 'hoy',     label: 'Hoy' },
  { key: 'manana',  label: 'Mañana' },
  { key: 'semana',  label: 'Esta semana' },
]

export function TripFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const dia     = params.get('dia')     ?? 'hoy'
  const origen  = params.get('origen')  ?? ''
  const destino = params.get('destino') ?? ''

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  return (
    <div className="space-y-3 mb-5">
      {/* Day tabs */}
      <div className="flex gap-2">
        {DIAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => update('dia', key)}
            className={cn(
              'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
              dia === key
                ? 'bg-brand text-white shadow-glow'
                : 'bg-surface-overlay text-ink-secondary hover:bg-surface-subtle'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Origin / Destination */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <select
            value={origen}
            onChange={(e) => update('origen', e.target.value)}
            className="input text-xs py-2.5"
          >
            <option value="">🔵 Origen</option>
            <optgroup label="Viña del Mar">
              {PUNTOS_VINA.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </optgroup>
            <optgroup label="Santiago">
              {ZONAS_SANTIAGO.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <select
            value={destino}
            onChange={(e) => update('destino', e.target.value)}
            className="input text-xs py-2.5"
          >
            <option value="">🟢 Destino</option>
            <optgroup label="Santiago">
              {ZONAS_SANTIAGO.map((z) => (
                <option key={z} value={z}>{z}</option>
              ))}
            </optgroup>
            <optgroup label="Viña del Mar">
              {PUNTOS_VINA.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </optgroup>
          </select>
        </div>
      </div>
    </div>
  )
}
