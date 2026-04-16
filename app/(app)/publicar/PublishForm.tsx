'use client'

import { useState, lazy, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PUNTOS_VINA, ZONAS_SANTIAGO } from '@/lib/types'
import type { DbVehiculo } from '@/lib/types'
import { cn } from '@/lib/utils'
import { MapPin, Clock, Users, DollarSign, FileText, Car, ChevronDown, Sparkles } from 'lucide-react'
import type { LatLng } from '@/components/map/MapPicker'

const MapPicker = lazy(() => import('@/components/map/MapPicker').then(m => ({ default: m.MapPicker })))

interface PublishFormProps {
  userId: string
  vehiculos: DbVehiculo[]
}

type Direccion = 'vina_santiago' | 'santiago_vina'

function detectDireccion(origen: string, destino: string): Direccion {
  const puntosVina = PUNTOS_VINA as unknown as string[]
  if (puntosVina.includes(origen)) return 'vina_santiago'
  if (puntosVina.includes(destino)) return 'santiago_vina'
  return 'vina_santiago'
}

export function PublishForm({ userId, vehiculos }: PublishFormProps) {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()

  // Pre-fill desde "Repetir viaje"
  const preOrigen    = searchParams.get('origen')    ?? ''
  const preDestino   = searchParams.get('destino')   ?? ''
  const preCupos     = Number(searchParams.get('cupos'))   || 3
  const prePrecio    = Number(searchParams.get('precio'))  || 4000
  const preNotas     = searchParams.get('notas')     ?? ''
  const preVehiculo  = searchParams.get('vehiculoId') ?? vehiculos[0]?.id ?? ''
  const preDireccion = (preOrigen || preDestino)
    ? detectDireccion(preOrigen, preDestino)
    : 'vina_santiago'

  const [direccion, setDireccion] = useState<Direccion>(preDireccion)
  const [origen, setOrigen] = useState(preOrigen)
  const [destino, setDestino] = useState(preDestino)
  const [fecha, setFecha] = useState(getTodayLocal())
  const [hora, setHora] = useState('07:00')
  const [cupos, setCupos] = useState(preCupos)
  const [precio, setPrecio] = useState(prePrecio)
  const [notas, setNotas] = useState(preNotas)
  const [puntoCoords, setPuntoCoords] = useState<LatLng | null>(null)
  const [vehiculoId, setVehiculoId] = useState(preVehiculo)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // IA natural text
  const [textoNatural, setTextoNatural] = useState('')
  const [loadingIA, setLoadingIA] = useState(false)
  const [showIA, setShowIA] = useState(false)

  const origenes = direccion === 'vina_santiago' ? PUNTOS_VINA : ZONAS_SANTIAGO
  const destinos = direccion === 'vina_santiago' ? ZONAS_SANTIAGO : PUNTOS_VINA

  async function handleIA() {
    if (!textoNatural.trim()) return
    setLoadingIA(true)
    try {
      const res = await fetch('/api/ia/parse-viaje', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto: textoNatural }),
      })
      const data = await res.json()
      if (data.origen)   setOrigen(data.origen)
      if (data.destino)  setDestino(data.destino)
      if (data.fecha)    setFecha(data.fecha)
      if (data.hora)     setHora(data.hora)
      if (data.cupos)    setCupos(data.cupos)
      if (data.precio)   setPrecio(data.precio)
      if (data.notas)    setNotas(data.notas)
      setShowIA(false)
    } catch {
      // IA falla silenciosamente, el usuario completa manual
    }
    setLoadingIA(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!origen || !destino) {
      setError('Debes seleccionar origen y destino')
      return
    }

    setLoading(true)

    const fechaHora = new Date(`${fecha}T${hora}:00`)

    const { data, error: dbError } = await supabase
      .from('viajes')
      .insert({
        chofer_id: userId,
        vehiculo_id: vehiculoId || null,
        origen,
        destino,
        fecha_hora: fechaHora.toISOString(),
        cupos_total: cupos,
        cupos_disponibles: cupos,
        precio_cupo: precio,
        notas: notas || null,
        punto_encuentro_lat: puntoCoords?.lat ?? null,
        punto_encuentro_lng: puntoCoords?.lng ?? null,
        estado: 'publicado',
      })
      .select('id')
      .single()

    setLoading(false)

    if (dbError) {
      setError('Error al publicar el viaje. Intenta nuevamente.')
      return
    }

    // Trigger IA alert matching in background (fire & forget)
    fetch('/api/alertas/match', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ viajeId: data.id }),
    }).catch(() => {})

    router.push(`/viajes/${data.id}?nuevo=1`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-8">

      {/* IA Quick Input */}
      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowIA(!showIA)}
          className="w-full p-4 flex items-center gap-3 text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-brand/20 flex items-center justify-center">
            <Sparkles size={15} className="text-brand" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink-primary">Crear con IA</p>
            <p className="text-xs text-ink-muted">Describe tu viaje en texto libre</p>
          </div>
          <ChevronDown
            size={16}
            className={cn('text-ink-muted transition-transform', showIA && 'rotate-180')}
          />
        </button>

        {showIA && (
          <div className="px-4 pb-4 border-t border-surface-border animate-slide-up">
            <textarea
              value={textoNatural}
              onChange={(e) => setTextoNatural(e.target.value)}
              placeholder='Ej: "salgo mañana 7am del Reloj de Flores a Pajaritos, 3 cupos, $4.000"'
              className="input resize-none mt-3 text-sm"
              rows={3}
            />
            <button
              type="button"
              onClick={handleIA}
              disabled={loadingIA || !textoNatural.trim()}
              className="btn-primary w-full mt-2 text-sm py-2.5"
            >
              {loadingIA ? 'Procesando…' : '✨ Prellenar formulario'}
            </button>
          </div>
        )}
      </div>

      {/* Direction toggle */}
      <div>
        <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
          Dirección
        </label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { key: 'vina_santiago', label: 'Montemar → Santiago' },
            { key: 'santiago_vina', label: 'Santiago → Montemar' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setDireccion(key)
                setOrigen('')
                setDestino('')
              }}
              className={cn(
                'py-3 rounded-xl text-sm font-medium transition-all border',
                direccion === key
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-surface-overlay border-surface-border text-ink-secondary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Origin */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
          <MapPin size={12} className="text-brand" /> Origen
        </label>
        <select
          value={origen}
          onChange={(e) => setOrigen(e.target.value)}
          className="input"
          required
        >
          <option value="">Selecciona punto de salida</option>
          {origenes.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Destination */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
          <MapPin size={12} className="text-success" /> Destino
        </label>
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className="input"
          required
        >
          <option value="">Selecciona zona de llegada</option>
          {destinos.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Date + Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
            <Clock size={12} /> Fecha
          </label>
          <input
            type="date"
            value={fecha}
            min={getTodayLocal()}
            onChange={(e) => setFecha(e.target.value)}
            className="input"
            required
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
            <Clock size={12} /> Hora
          </label>
          <input
            type="time"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            className="input"
            required
          />
        </div>
      </div>

      {/* Seats */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
          <Users size={12} /> Cupos disponibles
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCupos(n)}
              className={cn(
                'flex-1 py-3 rounded-xl text-sm font-bold transition-all border',
                cupos === n
                  ? 'bg-brand border-brand text-white'
                  : 'bg-surface-overlay border-surface-border text-ink-secondary hover:border-brand/50'
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
          <DollarSign size={12} /> Precio por cupo
        </label>
        <div className="flex gap-2 flex-wrap">
          {[3000, 3500, 4000, 4500, 5000].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPrecio(p)}
              className={cn(
                'flex-1 min-w-[70px] py-3 rounded-xl text-xs font-bold transition-all border',
                precio === p
                  ? 'bg-brand border-brand text-white'
                  : 'bg-surface-overlay border-surface-border text-ink-secondary hover:border-brand/50'
              )}
            >
              ${(p / 1000).toFixed(p % 1000 === 0 ? 0 : 1)}k
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-ink-muted">$</span>
          <input
            type="number"
            value={precio}
            min={1000}
            max={20000}
            step={500}
            onChange={(e) => setPrecio(Number(e.target.value))}
            className="input flex-1"
          />
        </div>
      </div>

      {/* Vehicle */}
      {vehiculos.length > 0 && (
        <div>
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
            <Car size={12} /> Vehículo
          </label>
          <select
            value={vehiculoId}
            onChange={(e) => setVehiculoId(e.target.value)}
            className="input"
          >
            <option value="">Sin vehículo especificado</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.marca} {v.modelo} · {v.patente} · {v.color}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Punto de encuentro */}
      <div>
        <label className="flex items-center gap-2 text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
          <MapPin size={12} className="text-brand" /> Punto de encuentro
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Ej: Calle Los Pinos 123, frente al portón verde"
          className="input resize-none mb-2"
          rows={2}
          maxLength={300}
        />
        <Suspense fallback={
          <div className="h-[240px] rounded-xl bg-surface-overlay border border-surface-border flex items-center justify-center">
            <p className="text-xs text-ink-muted">Cargando mapa…</p>
          </div>
        }>
          <MapPicker
            value={puntoCoords}
            onChange={(coords, address) => {
              setPuntoCoords(coords)
              if (!notas) setNotas(address)
            }}
          />
        </Suspense>
        <p className="text-xs text-ink-muted mt-1.5">
          Busca una dirección o toca el mapa para marcar el punto exacto
        </p>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/30 rounded-xl p-3">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full py-4 text-base font-bold"
      >
        {loading ? 'Publicando…' : '🚀 Publicar viaje'}
      </button>
    </form>
  )
}

function getTodayLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Santiago' })
}
