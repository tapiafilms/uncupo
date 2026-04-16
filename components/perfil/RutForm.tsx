'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { validarRut, formatearRut } from '@/lib/rut'
import { useRouter } from 'next/navigation'
import { Check, ShieldCheck, ShieldAlert } from 'lucide-react'

interface Props {
  userId: string
  rutActual: string | null
}

export function RutForm({ userId, rutActual }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [rut, setRut] = useState(rutActual ?? '')
  const [editing, setEditing] = useState(!rutActual)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esValido = validarRut(rut)

  function handleChange(val: string) {
    setRut(val)
    setError(null)
  }

  function handleBlur() {
    if (rut && esValido) setRut(formatearRut(rut))
  }

  async function handleSave() {
    if (!esValido) {
      setError('RUT inválido. Verifica el dígito verificador.')
      return
    }
    setLoading(true)
    const { error: dbErr } = await supabase
      .from('users')
      .update({ rut: formatearRut(rut) })
      .eq('id', userId)
    setLoading(false)
    if (dbErr) { setError('No se pudo guardar.'); return }
    setEditing(false)
    router.refresh()
  }

  if (!editing && rutActual) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} className="text-success shrink-0" />
          <span className="text-sm text-ink-primary font-medium">{rutActual}</span>
        </div>
        <button
          onClick={() => setEditing(true)}
          className="text-xs text-brand font-medium"
        >
          Editar
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={rut}
            onChange={e => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder="12.345.678-9"
            className="input py-2 text-sm pr-8"
            maxLength={12}
            autoComplete="off"
          />
          {rut && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2">
              {esValido
                ? <ShieldCheck size={14} className="text-success" />
                : <ShieldAlert size={14} className="text-danger" />
              }
            </span>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={loading || !esValido}
          className="w-9 h-9 rounded-xl bg-success/20 text-success flex items-center justify-center disabled:opacity-40"
        >
          <Check size={16} />
        </button>
        {rutActual && (
          <button
            onClick={() => { setEditing(false); setRut(rutActual) }}
            className="text-xs text-ink-muted"
          >
            Cancelar
          </button>
        )}
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      {rut && !esValido && (
        <p className="text-xs text-ink-muted">Ingresa tu RUT sin puntos ni guión y se formateará solo</p>
      )}
    </div>
  )
}
