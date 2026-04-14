import { cn } from '@/lib/utils'
import type { TripState } from '@/lib/types'

const CONFIG: Record<TripState, { label: string; class: string }> = {
  publicado:  { label: 'Disponible',  class: 'text-info bg-info/10 border-info/20' },
  confirmado: { label: 'Confirmado',  class: 'text-success bg-success/10 border-success/20' },
  en_camino:  { label: 'En camino',   class: 'text-warning bg-warning/10 border-warning/20' },
  en_destino: { label: 'En destino',  class: 'text-brand bg-brand/10 border-brand/20' },
  finalizado: { label: 'Finalizado',  class: 'text-ink-muted bg-surface-overlay border-surface-border' },
  cancelado:  { label: 'Cancelado',   class: 'text-danger bg-danger/10 border-danger/20' },
}

export function TripStatusBadge({ estado }: { estado: TripState }) {
  const cfg = CONFIG[estado] ?? CONFIG.publicado
  return (
    <span className={cn('badge border text-xs font-semibold', cfg.class)}>
      {cfg.label}
    </span>
  )
}
