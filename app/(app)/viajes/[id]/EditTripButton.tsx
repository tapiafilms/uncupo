'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { EditTripForm } from './EditTripForm'

interface Props {
  viajeId: string
  inicial: {
    fecha: string
    hora: string
    precio: number
    cupos: number
    notas: string
    reservados: number
  }
}

export function EditTripButton({ viajeId, inicial }: Props) {
  const [open, setOpen] = useState(false)

  if (open) {
    return (
      <EditTripForm
        viajeId={viajeId}
        inicial={inicial}
        onClose={() => setOpen(false)}
      />
    )
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-surface-overlay border border-surface-border text-ink-secondary hover:text-brand hover:border-brand/40 transition-all active:scale-95 mb-4"
    >
      <Pencil size={12} />
      Editar viaje
    </button>
  )
}
