'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { cn } from '@/lib/utils'

const RUTAS = [
  { key: 'vina-stgo', label: 'Viña → Santiago' },
  { key: 'stgo-vina', label: 'Santiago → Viña' },
]

function todayStr() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}
function tomorrowStr() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}

export function TripFilters() {
  const router   = useRouter()
  const pathname = usePathname()
  const params   = useSearchParams()
  const ruta     = params.get('ruta') ?? 'vina-stgo'
  const fecha    = params.get('fecha') ?? ''
  const hora     = params.get('hora') ?? ''

  const update = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params.toString())
    if (value) next.set(key, value)
    else next.delete(key)
    router.push(`${pathname}?${next.toString()}`)
  }, [params, pathname, router])

  const today    = todayStr()
  const tomorrow = tomorrowStr()

  return (
    <div className="space-y-2">
      {/* Dirección */}
      <div className="flex gap-2">
        {RUTAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => update('ruta', key)}
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

      {/* Fecha + Hora */}
      <div className="flex gap-2">
        {/* Fecha — botones rápidos + picker */}
        <div className="flex gap-1.5 flex-1">
          {[
            { val: '',        label: 'Todos' },
            { val: today,     label: 'Hoy' },
            { val: tomorrow,  label: 'Mañana' },
          ].map(({ val, label }) => (
            <button
              key={label}
              onClick={() => { update('fecha', val); update('hora', '') }}
              className={cn(
                'flex-1 py-2 rounded-xl text-xs font-semibold transition-all',
                fecha === val
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-overlay/60 text-ink-secondary hover:bg-surface-subtle'
              )}
            >
              {label}
            </button>
          ))}
          {/* Picker de fecha personalizada */}
          <div className="relative flex-1">
            <input
              type="date"
              value={fecha && fecha !== today && fecha !== tomorrow ? fecha : ''}
              min={today}
              onChange={e => { update('fecha', e.target.value); update('hora', '') }}
              className={cn(
                'w-full py-2 rounded-xl text-xs font-semibold text-center transition-all appearance-none cursor-pointer',
                'bg-surface-overlay/60 text-ink-secondary hover:bg-surface-subtle',
                fecha && fecha !== today && fecha !== tomorrow
                  ? 'bg-white/20 text-white'
                  : ''
              )}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Hora — solo si hay fecha seleccionada */}
        {fecha && (
          <div className="relative shrink-0">
            <input
              type="time"
              value={hora}
              onChange={e => update('hora', e.target.value)}
              className={cn(
                'py-2 px-2.5 rounded-xl text-xs font-semibold transition-all appearance-none cursor-pointer w-24',
                hora
                  ? 'bg-white/20 text-white'
                  : 'bg-surface-overlay/60 text-ink-secondary hover:bg-surface-subtle'
              )}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
