'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

const RUTAS = [
  { key: 'vina-stgo', label: 'Viña → Santiago' },
  { key: 'stgo-vina', label: 'Santiago → Viña' },
]

export function TripFilters() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const ruta     = params.get('ruta') ?? 'vina-stgo'

  const update = useCallback((value: string) => {
    const next = new URLSearchParams(params.toString())
    next.set('ruta', value)
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  return (
    <div className="flex gap-2">
      {RUTAS.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => update(key)}
          className={cn(
            'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all',
            ruta === key
              ? 'bg-brand text-white shadow-glow'
              : 'bg-surface-overlay/80 text-ink-secondary hover:bg-surface-subtle'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
