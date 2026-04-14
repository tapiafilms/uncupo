'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Star, ChevronRight } from 'lucide-react'

interface Persona { id: string; nombre: string; rol: string }

interface Props {
  viajeId: string
  userId: string
  personas: Persona[]
}

export function RatingForm({ viajeId, userId, personas }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const [idx, setIdx] = useState(0)
  const [estrellas, setEstrellas] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const persona = personas[idx]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (estrellas === 0) return
    setLoading(true)

    await supabase.from('calificaciones').insert({
      viaje_id: viajeId,
      de_user_id: userId,
      a_user_id: persona.id,
      estrellas,
      comentario: comentario.trim() || null,
    })

    // Notify rated user
    await supabase.from('notificaciones').insert({
      user_id: persona.id,
      tipo: 'calificacion_recibida',
      titulo: '⭐ Recibiste una calificación',
      mensaje: `Te dieron ${estrellas} estrella${estrellas !== 1 ? 's' : ''}${comentario ? `: "${comentario.slice(0, 60)}"` : ''}`,
      leido: false,
    })

    setLoading(false)

    if (idx + 1 < personas.length) {
      setIdx(idx + 1)
      setEstrellas(0)
      setComentario('')
    } else {
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-4">
          <span className="text-4xl">🙌</span>
        </div>
        <p className="text-ink-primary font-bold text-xl">¡Gracias!</p>
        <p className="text-ink-muted text-sm mt-1 mb-8">Tus calificaciones ayudan a construir confianza</p>
        <a href="/mis-viajes" className="btn-primary px-8">Ver mis viajes</a>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Progress */}
      {personas.length > 1 && (
        <div className="flex gap-1.5 mb-6">
          {personas.map((_, i) => (
            <div key={i} className={cn('flex-1 h-1 rounded-full transition-all', i <= idx ? 'bg-brand' : 'bg-surface-overlay')} />
          ))}
        </div>
      )}

      {/* Person card */}
      <div className="card p-5 mb-6 text-center">
        <div className="w-16 h-16 rounded-full bg-brand/20 flex items-center justify-center text-2xl font-bold text-brand mx-auto mb-3">
          {persona.nombre[0]?.toUpperCase() ?? '?'}
        </div>
        <p className="font-bold text-ink-primary text-lg">{persona.nombre}</p>
        <p className="text-ink-muted text-sm capitalize mt-0.5">{persona.rol}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Stars */}
        <div>
          <p className="text-sm font-semibold text-ink-secondary text-center mb-3">
            ¿Cómo fue tu experiencia?
          </p>
          <div className="flex justify-center gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setEstrellas(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="transition-transform active:scale-90"
              >
                <Star
                  size={40}
                  className={cn(
                    'transition-all duration-100',
                    n <= (hover || estrellas)
                      ? 'text-warning fill-warning'
                      : 'text-surface-subtle'
                  )}
                />
              </button>
            ))}
          </div>
          {estrellas > 0 && (
            <p className="text-center text-sm text-ink-secondary mt-2 animate-fade-in">
              {['', '😞 Mala experiencia', '😕 Podría mejorar', '😊 Estuvo bien', '😄 Muy buena', '🤩 ¡Excelente!'][estrellas]}
            </p>
          )}
        </div>

        {/* Comment */}
        <div>
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wider block mb-2">
            Comentario (opcional)
          </label>
          <textarea
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder={persona.rol === 'chofer'
              ? 'Ej: Muy puntual, buena conducción...'
              : 'Ej: Muy buen pasajero, puntual...'}
            className="input resize-none"
            rows={3}
            maxLength={200}
          />
          <p className="text-xs text-ink-muted text-right mt-1">{comentario.length}/200</p>
        </div>

        <button
          type="submit"
          disabled={loading || estrellas === 0}
          className="btn-primary w-full py-4 text-base font-bold flex items-center justify-center gap-2"
        >
          {loading ? 'Guardando…' : idx + 1 < personas.length ? (
            <><span>Siguiente</span><ChevronRight size={18} /></>
          ) : 'Enviar calificación'}
        </button>

        <button
          type="button"
          onClick={() => idx + 1 < personas.length ? (setIdx(idx + 1), setEstrellas(0), setComentario('')) : setDone(true)}
          className="btn-ghost w-full text-sm text-ink-muted"
        >
          Saltar
        </button>
      </form>
    </div>
  )
}
