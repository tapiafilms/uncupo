'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User, MapPin, ArrowRight } from 'lucide-react'
import { SECTORES } from '@/lib/types'

export function OnboardingForm({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [sector, setSector] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim() || !sector) return
    setLoading(true)
    setError(null)

    const { error } = await supabase
      .from('users')
      .update({ nombre: nombre.trim(), sector })
      .eq('id', userId)

    setLoading(false)

    if (error) {
      setError('No se pudo guardar. Intenta nuevamente.')
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">Tu nombre</label>
        <div className="relative">
          <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre completo"
            className="input pl-10"
            autoFocus
            required
            maxLength={50}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">¿Dónde vives?</label>
        <div className="relative">
          <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="input pl-10 appearance-none"
            required
          >
            <option value="">Selecciona tu sector</option>
            {SECTORES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-danger text-sm animate-fade-in">{error}</p>}

      <button
        type="submit"
        disabled={loading || !nombre.trim() || !sector}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? 'Guardando…' : (
          <>
            Entrar a UNcupo
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  )
}
