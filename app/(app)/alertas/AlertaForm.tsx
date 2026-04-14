'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PUNTOS_VINA, ZONAS_SANTIAGO } from '@/lib/types'
import { Bell, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { usePushNotifications } from '@/lib/hooks/usePushNotifications'

export function AlertaForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const { permission, subscribed, loading: pushLoading, subscribe } = usePushNotifications(userId)

  const [open, setOpen] = useState(false)
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [fechaMin, setFechaMin] = useState('')
  const [fechaMax, setFechaMax] = useState('')
  const [horaMin, setHoraMin] = useState('')
  const [horaMax, setHoraMax] = useState('')
  const [precioMax, setPrecioMax] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!origen || !destino) return
    setLoading(true)

    const { error } = await supabase.from('alertas').insert({
      pasajero_id: userId,
      origen,
      destino,
      fecha_min: fechaMin || null,
      fecha_max: fechaMax || null,
      hora_min: horaMin || null,
      hora_max: horaMax || null,
      precio_max: precioMax ? Number(precioMax) : null,
      activa: true,
    })

    setLoading(false)
    if (!error) {
      setOpen(false)
      setOrigen(''); setDestino(''); setFechaMin(''); setFechaMax('')
      setHoraMin(''); setHoraMax(''); setPrecioMax('')
      router.refresh()
    }
  }

  const allLocations = [...PUNTOS_VINA, ...ZONAS_SANTIAGO]

  return (
    <div>
      {/* Push permission banner */}
      {permission !== 'granted' && permission !== 'unsupported' && !pushLoading && (
        <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <Bell size={18} className="text-brand shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-brand">Activa notificaciones push</p>
            <p className="text-xs text-brand/70 mt-0.5">Recibe alertas aunque no tengas la app abierta</p>
          </div>
          <button onClick={subscribe} className="btn-primary text-xs py-2 px-3 shrink-0">
            Activar
          </button>
        </div>
      )}
      {subscribed && (
        <div className="bg-success/10 border border-success/30 rounded-2xl p-3 mb-4 flex items-center gap-2">
          <span className="text-success text-sm">🔔 Notificaciones push activadas</span>
        </div>
      )}

      {/* Toggle form */}
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          Nueva alerta de viaje
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="card p-4 space-y-4 animate-slide-up overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-ink-primary">Nueva alerta</p>
            <button type="button" onClick={() => setOpen(false)} className="text-ink-muted text-xl leading-none">×</button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Origen</label>
              <select value={origen} onChange={e => setOrigen(e.target.value)} className="input text-sm" required>
                <option value="">Cualquiera</option>
                <optgroup label="Viña del Mar">
                  {PUNTOS_VINA.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
                <optgroup label="Santiago">
                  {ZONAS_SANTIAGO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="text-xs text-ink-muted mb-1 block">Destino</label>
              <select value={destino} onChange={e => setDestino(e.target.value)} className="input text-sm" required>
                <option value="">Cualquiera</option>
                <optgroup label="Santiago">
                  {ZONAS_SANTIAGO.map(z => <option key={z} value={z}>{z}</option>)}
                </optgroup>
                <optgroup label="Viña del Mar">
                  {PUNTOS_VINA.map(p => <option key={p} value={p}>{p}</option>)}
                </optgroup>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-ink-muted block">Rango de fechas</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted w-10 shrink-0">Desde</span>
              <input type="date" value={fechaMin} onChange={e => setFechaMin(e.target.value)} className="input text-sm flex-1" style={{ maxWidth: '100%' }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted w-10 shrink-0">Hasta</span>
              <input type="date" value={fechaMax} onChange={e => setFechaMax(e.target.value)} className="input text-sm flex-1" style={{ maxWidth: '100%' }} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-ink-muted block">Rango de horario</label>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted w-10 shrink-0">Desde</span>
              <input type="time" value={horaMin} onChange={e => setHoraMin(e.target.value)} className="input text-sm flex-1" style={{ maxWidth: '100%' }} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink-muted w-10 shrink-0">Hasta</span>
              <input type="time" value={horaMax} onChange={e => setHoraMax(e.target.value)} className="input text-sm flex-1" style={{ maxWidth: '100%' }} />
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-muted mb-1 block">Precio máximo (opcional)</label>
            <input
              type="number"
              value={precioMax}
              onChange={e => setPrecioMax(e.target.value)}
              placeholder="Ej: 4500"
              className="input text-sm"
              min={1000}
              step={500}
            />
          </div>

          <button type="submit" disabled={loading || !origen || !destino} className="btn-primary w-full">
            {loading ? 'Guardando…' : '🔔 Crear alerta'}
          </button>
        </form>
      )}
    </div>
  )
}
