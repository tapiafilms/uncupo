'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, BellOff, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Alerta {
  id: string
  origen: string
  destino: string
  fecha_min: string | null
  fecha_max: string | null
  hora_min: string | null
  hora_max: string | null
  precio_max: number | null
  activa: boolean
}

export function AlertasList({ alertas }: { alertas: Alerta[] }) {
  const supabase = createClient()
  const router = useRouter()
  const [toggling, setToggling] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function toggleAlerta(id: string, activa: boolean) {
    setToggling(id)
    await supabase.from('alertas').update({ activa: !activa }).eq('id', id)
    setToggling(null)
    router.refresh()
  }

  async function deleteAlerta(id: string) {
    setDeleting(id)
    await supabase.from('alertas').delete().eq('id', id)
    setDeleting(null)
    router.refresh()
  }

  if (alertas.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Bell size={32} className="text-ink-muted mx-auto mb-3" />
        <p className="text-ink-secondary font-medium">Sin alertas activas</p>
        <p className="text-ink-muted text-sm mt-1">
          Crea una alerta y te avisamos cuando salga un viaje que te interesa
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
        {alertas.filter(a => a.activa).length} activa{alertas.filter(a => a.activa).length !== 1 ? 's' : ''} de {alertas.length}
      </p>
      {alertas.map((alerta) => (
        <div key={alerta.id} className={cn('card p-4 transition-all', !alerta.activa && 'opacity-50')}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
              alerta.activa ? 'bg-brand/20' : 'bg-surface-overlay'
            )}>
              <Bell size={16} className={alerta.activa ? 'text-brand' : 'text-ink-muted'} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink-primary text-sm">
                {alerta.origen} → {alerta.destino}
              </p>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {(alerta.fecha_min || alerta.fecha_max) && (
                  <span className="badge bg-surface-overlay text-ink-muted text-[10px]">
                    📅 {alerta.fecha_min ?? '?'} – {alerta.fecha_max ?? '?'}
                  </span>
                )}
                {(alerta.hora_min || alerta.hora_max) && (
                  <span className="badge bg-surface-overlay text-ink-muted text-[10px]">
                    🕐 {alerta.hora_min ?? '?'} – {alerta.hora_max ?? '?'}
                  </span>
                )}
                {alerta.precio_max && (
                  <span className="badge bg-surface-overlay text-ink-muted text-[10px]">
                    💰 máx ${alerta.precio_max.toLocaleString('es-CL')}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => toggleAlerta(alerta.id, alerta.activa)}
                disabled={toggling === alerta.id}
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all',
                  alerta.activa ? 'bg-brand/10 text-brand' : 'bg-surface-overlay text-ink-muted'
                )}
              >
                {alerta.activa ? <Bell size={14} /> : <BellOff size={14} />}
              </button>
              <button
                onClick={() => deleteAlerta(alerta.id)}
                disabled={deleting === alerta.id}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-danger/10 text-danger transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
