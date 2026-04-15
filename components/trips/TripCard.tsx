import Link from 'next/link'
import { Clock, Users } from 'lucide-react'
import { formatPrice, formatRelativeDay, formatTime, cn } from '@/lib/utils'
import type { ViajeConChofer } from '@/lib/types'

interface TripCardProps {
  viaje: ViajeConChofer
  compact?: boolean
}

const ESTADO_COLORS: Record<string, string> = {
  publicado:  'text-info bg-info/10',
  confirmado: 'text-success bg-success/10',
  en_camino:  'text-warning bg-warning/10',
  en_destino: 'text-brand bg-brand/10',
  finalizado: 'text-ink-muted bg-surface-overlay',
  cancelado:  'text-danger bg-danger/10',
}

const ESTADO_LABELS: Record<string, string> = {
  publicado:  'Disponible',
  confirmado: 'Confirmado',
  en_camino:  'En camino',
  en_destino: 'En destino',
  finalizado: 'Finalizado',
  cancelado:  'Cancelado',
}

export function TripCard({ viaje, compact = false }: TripCardProps) {
  const ocupados    = viaje.cupos_total - viaje.cupos_disponibles
  const porcentaje  = (ocupados / viaje.cupos_total) * 100
  const lleno       = viaje.cupos_disponibles === 0
  const inicial     = viaje.chofer?.nombre?.[0]?.toUpperCase() ?? '?'

  return (
    <div className={cn('card overflow-hidden', lleno && 'opacity-60')}>

      {/* Área principal → detalle del viaje */}
      <Link
        href={`/viajes/${viaje.id}`}
        className="block p-4 hover:bg-surface-overlay/40 active:bg-surface-overlay/60 transition-colors"
      >
        <div className="flex items-start gap-3">
          {/* Indicador de ruta */}
          <div className="flex flex-col items-center pt-1.5 gap-1 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-brand ring-2 ring-brand/30" />
            <span className="w-px h-8 bg-gradient-to-b from-brand/50 to-success/50" />
            <span className="w-2.5 h-2.5 rounded-full bg-success ring-2 ring-success/30" />
          </div>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-ink-primary text-sm leading-tight truncate">
                  {viaje.origen}
                </p>
                <p className="font-semibold text-ink-primary text-sm leading-tight truncate mt-4">
                  {viaje.destino}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-brand font-bold text-xl leading-tight">
                  {formatPrice(viaje.precio_cupo)}
                </p>
                <p className="text-ink-muted text-[10px]">por cupo</p>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-ink-secondary">
                <Clock size={11} />
                {formatRelativeDay(viaje.fecha_hora)} · {formatTime(viaje.fecha_hora)}
              </span>
              <span className={cn(
                'badge text-[10px]',
                ESTADO_COLORS[viaje.estado] ?? 'text-ink-muted bg-surface-overlay'
              )}>
                {ESTADO_LABELS[viaje.estado] ?? viaje.estado}
              </span>
            </div>

            {/* Barra de cupos */}
            {!compact && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="flex items-center gap-1 text-xs text-ink-secondary">
                    <Users size={11} />
                    {lleno
                      ? 'Sin cupos'
                      : `${viaje.cupos_disponibles} cupo${viaje.cupos_disponibles !== 1 ? 's' : ''} libre${viaje.cupos_disponibles !== 1 ? 's' : ''}`}
                  </span>
                  <span className="text-xs text-ink-muted">{ocupados}/{viaje.cupos_total}</span>
                </div>
                <div className="h-1 bg-surface-overlay rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      porcentaje >= 100 ? 'bg-danger' :
                      porcentaje >= 75  ? 'bg-warning' : 'bg-success'
                    )}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Link>

      {/* Área del chofer → perfil del chofer */}
      <Link
        href={`/usuario/${viaje.chofer_id}`}
        className="flex items-center gap-2.5 px-4 py-2.5 border-t border-surface-border/60 hover:bg-surface-overlay/40 transition-colors"
      >
        {/* Avatar */}
        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-brand/20 flex items-center justify-center">
          {viaje.chofer?.foto_url
            ? <img src={viaje.chofer.foto_url} alt={viaje.chofer.nombre} className="w-full h-full object-cover" />
            : <span className="text-[11px] font-bold text-brand">{inicial}</span>
          }
        </div>

        <span className="text-xs text-ink-secondary flex-1 truncate font-medium">
          {viaje.chofer?.nombre || 'Chofer'}
        </span>

        {viaje.chofer?.calificacion_promedio > 0 && (
          <span className="text-xs text-warning font-semibold shrink-0">
            ★ {Number(viaje.chofer.calificacion_promedio).toFixed(1)}
          </span>
        )}

        <span className="text-[10px] text-brand font-medium shrink-0">Ver perfil →</span>
      </Link>
    </div>
  )
}
