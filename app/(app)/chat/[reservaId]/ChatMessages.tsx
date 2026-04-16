'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface Mensaje {
  id: string
  de_user_id: string
  texto: string
  creado_en: string
}

interface Props {
  reservaId: string
  userId: string
  mensajesIniciales: Mensaje[]
  viajeEstado: string
}

export function ChatMessages({ reservaId, userId, mensajesIniciales, viajeEstado }: Props) {
  const supabase = createClient()
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales)
  const [texto, setTexto] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const chatCerrado = ['finalizado', 'cancelado'].includes(viajeEstado)

  // Scroll al fondo
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${reservaId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes',
          filter: `reserva_id=eq.${reservaId}`,
        },
        (payload) => {
          const nuevo = payload.new as Mensaje
          setMensajes((prev) => {
            if (prev.find((m) => m.id === nuevo.id)) return prev
            return [...prev, nuevo]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [reservaId])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t || sending) return

    setSending(true)
    setTexto('')

    // Optimistic: mostrar el mensaje de inmediato
    const tempId = `temp-${Date.now()}`
    const tempMsg: Mensaje = {
      id: tempId,
      de_user_id: userId,
      texto: t,
      creado_en: new Date().toISOString(),
    }
    setMensajes(prev => [...prev, tempMsg])

    const { data: inserted, error } = await supabase
      .from('mensajes')
      .insert({ reserva_id: reservaId, de_user_id: userId, texto: t })
      .select('id, de_user_id, texto, creado_en')
      .single()

    setSending(false)
    if (error) {
      // Revertir si falló
      setTexto(t)
      setMensajes(prev => prev.filter(m => m.id !== tempId))
    } else {
      // Reemplazar temp con el mensaje real (Realtime lo deduplicará por id)
      setMensajes(prev => prev.map(m => m.id === tempId ? inserted : m))
      inputRef.current?.focus()
    }
  }

  return (
    <>
      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {mensajes.length === 0 && (
          <p className="text-center text-ink-muted text-sm mt-10">No hay mensajes aún</p>
        )}
        {mensajes.map((m) => {
          const esMio = m.de_user_id === userId
          return (
            <div key={m.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  esMio
                    ? 'bg-brand text-white rounded-br-sm'
                    : 'bg-surface-overlay text-ink-primary border border-surface-border rounded-bl-sm'
                }`}
              >
                {m.texto}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {chatCerrado ? (
        <div className="px-4 pb-safe pb-6 pt-3 border-t border-surface-border text-center shrink-0">
          <p className="text-xs text-ink-muted">Este chat ya no está disponible</p>
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="flex items-center gap-2 px-4 pb-safe pb-6 pt-3 border-t border-surface-border bg-surface-base shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje…"
            className="input flex-1 py-2.5 text-sm"
            maxLength={500}
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!texto.trim() || sending}
            className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white
                       disabled:opacity-40 active:scale-95 transition-all shrink-0"
          >
            <Send size={16} />
          </button>
        </form>
      )}
    </>
  )
}
