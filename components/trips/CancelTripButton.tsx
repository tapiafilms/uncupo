'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

export function CancelTripButton({ viajeId }: { viajeId: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancelar() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/viajes/cancelar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viajeId }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'No se pudo cancelar.')
      return
    }

    router.refresh()
  }

  if (confirm) {
    return (
      <div className="mt-2 p-3 bg-danger/5 border border-danger/20 rounded-xl space-y-2 animate-slide-up">
        <p className="text-xs text-danger font-medium text-center">
          ¿Cancelar este viaje? Se notificará a los pasajeros.
        </p>
        {error && <p className="text-danger text-xs text-center">{error}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setConfirm(false)}
            className="btn-secondary text-xs py-2"
          >
            Mantener
          </button>
          <button
            onClick={handleCancelar}
            disabled={loading}
            className="bg-danger hover:bg-danger/80 text-white font-semibold rounded-xl py-2 text-xs transition-all"
          >
            {loading ? 'Cancelando…' : 'Sí, cancelar'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-all active:scale-95 bg-danger/10 text-danger hover:bg-danger/20"
    >
      <Trash2 size={12} />
      Cancelar viaje
    </button>
  )
}
