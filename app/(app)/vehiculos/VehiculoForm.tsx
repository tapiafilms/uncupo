'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { uploadVehiculoFoto } from '@/lib/storage'
import { Camera, Loader2, Car, Check } from 'lucide-react'
import type { DbVehiculo } from '@/lib/types'

interface Props {
  userId: string
  vehiculo?: DbVehiculo   // if editing existing
  onDone: () => void
}

export function VehiculoForm({ userId, vehiculo, onDone }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [patente, setPatente] = useState(vehiculo?.patente ?? '')
  const [marca, setMarca] = useState(vehiculo?.marca ?? '')
  const [modelo, setModelo] = useState(vehiculo?.modelo ?? '')
  const [color, setColor] = useState(vehiculo?.color ?? '')
  const [fotoPreview, setFotoPreview] = useState<string | null>(vehiculo?.foto_url ?? null)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleFotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!patente || !marca || !modelo || !color) {
      setError('Completa todos los campos')
      return
    }
    setError(null)
    setLoading(true)

    try {
      let foto_url = vehiculo?.foto_url ?? null

      if (vehiculo) {
        // Update existing
        await supabase
          .from('vehiculos')
          .update({ patente: patente.toUpperCase(), marca, modelo, color })
          .eq('id', vehiculo.id)

        // Upload photo if new one selected
        if (fotoFile) {
          setUploadingFoto(true)
          foto_url = await uploadVehiculoFoto(userId, vehiculo.id, fotoFile)
          await supabase.from('vehiculos').update({ foto_url }).eq('id', vehiculo.id)
          setUploadingFoto(false)
        }
      } else {
        // Insert new
        const { data, error: dbError } = await supabase
          .from('vehiculos')
          .insert({ user_id: userId, patente: patente.toUpperCase(), marca, modelo, color })
          .select('id')
          .single()

        if (dbError || !data) throw dbError

        // Upload photo if selected
        if (fotoFile) {
          setUploadingFoto(true)
          foto_url = await uploadVehiculoFoto(userId, data.id, fotoFile)
          await supabase.from('vehiculos').update({ foto_url }).eq('id', data.id)
          setUploadingFoto(false)
        }
      }

      router.refresh()
      onDone()
    } catch {
      setError('Error al guardar el vehículo')
    } finally {
      setLoading(false)
      setUploadingFoto(false)
    }
  }

  const isLoading = loading || uploadingFoto

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
      {/* Photo picker */}
      <div className="flex flex-col items-center">
        <button
          type="button"
          onClick={() => fotoInputRef.current?.click()}
          className="relative w-full h-44 rounded-2xl overflow-hidden bg-surface-overlay border-2 border-dashed border-surface-border group hover:border-brand/50 transition-colors"
        >
          {fotoPreview ? (
            <img src={fotoPreview} alt="Foto del auto" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Car size={36} className="text-ink-muted" />
              <p className="text-sm text-ink-muted">Toca para agregar foto del auto</p>
            </div>
          )}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity
            ${uploadingFoto ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
            {uploadingFoto
              ? <Loader2 size={28} className="text-white animate-spin" />
              : <Camera size={28} className="text-white" />
            }
          </div>
        </button>
        <input
          ref={fotoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFotoSelect}
          className="hidden"
        />
      </div>

      {/* Fields */}
      <div>
        <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
          Patente
        </label>
        <input
          type="text"
          value={patente}
          onChange={e => setPatente(e.target.value.toUpperCase())}
          placeholder="ABCD12"
          className="input uppercase"
          maxLength={6}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
            Marca
          </label>
          <input
            type="text"
            value={marca}
            onChange={e => setMarca(e.target.value)}
            placeholder="Toyota"
            className="input"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
            Modelo
          </label>
          <input
            type="text"
            value={modelo}
            onChange={e => setModelo(e.target.value)}
            placeholder="Corolla"
            className="input"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-1.5">
          Color
        </label>
        <input
          type="text"
          value={color}
          onChange={e => setColor(e.target.value)}
          placeholder="Blanco"
          className="input"
          required
        />
      </div>

      {error && (
        <p className="text-danger text-sm">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onDone}
          className="btn-secondary flex-1"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              {uploadingFoto ? 'Subiendo foto…' : 'Guardando…'}
            </>
          ) : (
            <>
              <Check size={16} />
              {vehiculo ? 'Guardar cambios' : 'Agregar vehículo'}
            </>
          )}
        </button>
      </div>
    </form>
  )
}
