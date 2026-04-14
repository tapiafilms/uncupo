'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'

type Step = 'email' | 'sent'

export function LoginForm() {
  const supabase = createClient()
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      setError('No pudimos enviar el link. Verifica tu email.')
      return
    }

    setStep('sent')
  }

  if (step === 'sent') {
    return (
      <div className="w-full max-w-sm text-center animate-slide-up">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-lg font-bold text-ink-primary">Revisa tu email</h2>
        <p className="text-ink-secondary text-sm mt-2">
          Enviamos un link a{' '}
          <span className="text-ink-primary font-semibold">{email}</span>
        </p>
        <p className="text-ink-muted text-xs mt-2">
          Haz clic en el link del email para ingresar.<br />
          Puede tardar hasta 1 minuto.
        </p>

        <button
          onClick={() => { setStep('email'); setError(null) }}
          className="btn-ghost w-full mt-6 text-sm"
        >
          Usar otro email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSendLink} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          Tu email
        </label>
        <div className="relative">
          <Mail
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="input pl-10"
            autoFocus
            autoComplete="email"
            required
          />
        </div>
      </div>

      {error && (
        <p className="text-danger text-sm animate-fade-in">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !email.includes('@')}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? 'Enviando…' : (
          <>
            Continuar
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-xs text-ink-muted text-center">
        Te enviaremos un link mágico — sin contraseña
      </p>
    </form>
  )
}
