'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, Users, DollarSign, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'

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
  onClose: () => void
}

export function EditTripForm({ viajeId, inicial, onClose }: Props) {
  const router = useRouter()
  const [fecha,  setFecha]  = useState(inicial.fecha)
  const [hora,   setHora]   = useState(inicial.hora)
  const [precio, setPrecio] = useState(inicial.precio)
  const [cupos,  setCupos]  = useState(inicial.cupos)
  const [notas,  setNotas]  = useState(inicial.notas)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  async function handleSave() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/viajes/editar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viajeId, fecha, hora, precio, cupos, notas }),
    })

    setLoading(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'No se pudo guardar.')
      return
    }

    onClose()
    router.refresh()
  }

  function getTodayLocal() {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
  }

  return (
    <div className="card p-4 mb-4 animate-slide-up border-brand/30">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-bold text-ink-primary">Editar viaje</p>
        <button onClick={onClose} className="text-ink-muted hover:text-ink-primary">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Fecha + Hora */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              <Clock size={11} /> Fecha
            </label>
            <input
              type="date"
              value={fecha}
              min={getTodayLocal()}
              onChange={e => setFecha(e.target.value)}
              className="input text-sm py-2"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
              <Clock size={11} /> Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={e => setHora(e.target.value)}
              className="input text-sm py-2"
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        {/* Precio */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            <DollarSign size={11} /> Precio por cupo
          </label>
          <div className="flex gap-2 flex-wrap">
            {[3000, 3500, 4000, 4500, 5000].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPrecio(p)}
                className={cn(
                  'flex-1 min-w-[60px] py-2.5 rounded-xl text-xs font-bold transition-all border',
                  precio === p
                    ? 'bg-brand border-brand text-white'
                    : 'bg-surface-overlay border-surface-border text-ink-secondary'
                )}
              >
                ${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}k
              </button>
            ))}
          </div>
          <input
            type="number"
            value={precio}
            min={1000}
            max={20000}
            step={500}
            onChange={e => setPrecio(Number(e.target.value))}
            className="input mt-2 text-sm py-2"
          />
        </div>

        {/* Cupos */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            <Users size={11} /> Cupos totales
            {inicial.reservados > 0 && (
              <span className="text-warning normal-case font-normal">
                (mín. {inicial.reservados} — ya reservados)
              </span>
            )}
          </label>
          <div className="flex gap-2">
            {[1,2,3,4,5,6].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => setCupos(n)}
                disabled={n < inicial.reservados}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border',
                  cupos === n
                    ? 'bg-brand border-brand text-white'
                    : 'bg-surface-overlay border-surface-border text-ink-secondary',
                  n < inicial.reservados && 'opacity-30 cursor-not-allowed'
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1.5">
            <MapPin size={11} /> Punto de encuentro
          </label>
          <textarea
            value={notas}
            onChange={e => setNotas(e.target.value)}
            className="input resize-none text-sm py-2"
            rows={2}
            maxLength={300}
          />
        </div>

        {error && (
          <p className="text-danger text-xs text-center">{error}</p>
        )}

        {inicial.reservados > 0 && (
          <p className="text-xs text-warning text-center">
            ⚠️ Tienes {inicial.reservados} pasajero{inicial.reservados !== 1 ? 's' : ''} reservado{inicial.reservados !== 1 ? 's' : ''} — se les notificará el cambio
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button onClick={onClose} className="btn-secondary text-sm py-3">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="btn-primary text-sm py-3"
          >
            {loading ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
