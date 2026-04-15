'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

const DIAS = [
  { key: 'hoy',    label: 'Hoy' },
  { key: 'manana', label: 'Mañana' },
  { key: 'semana', label: 'Esta semana' },
]

export function TripFilters() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const dia      = params.get('dia') ?? 'hoy'

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  return (
    <div className="flex gap-2 mb-5">
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
  )
}
