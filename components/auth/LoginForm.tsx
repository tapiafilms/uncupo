'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

type Step = 'phone' | 'otp'

export function LoginForm() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // Format phone: ensure +56 9 XXXX XXXX
  function normalizePhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.startsWith('569')) return `+${digits}`
    if (digits.startsWith('9') && digits.length === 9) return `+56${digits}`
    if (digits.startsWith('56')) return `+${digits}`
    return `+56${digits}`
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const normalized = normalizePhone(phone)

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalized,
    })

    setLoading(false)

    if (error) {
      setError('No pudimos enviar el código. Verifica el número.')
      return
    }

    setStep('otp')
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const normalized = normalizePhone(phone)

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp,
      type: 'sms',
    })

    if (error) {
      setLoading(false)
      setError('Código incorrecto o expirado.')
      return
    }

    // Create user profile if first time
    if (data.user) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        await supabase.from('users').insert({
          id: data.user.id,
          nombre: '',
          telefono: normalized,
        })
      }
    }

    router.replace('/home')
  }

  return (
    <div className="w-full max-w-sm">
      {step === 'phone' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">
              Número de teléfono
            </label>
            <div className="flex gap-2">
              <span className="flex items-center px-3 bg-surface-overlay border border-surface-border rounded-xl text-ink-secondary text-sm font-medium">
                🇨🇱 +56
              </span>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="9 1234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input flex-1"
                autoFocus
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-danger text-sm animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || phone.length < 8}
            className="btn-primary w-full"
          >
            {loading ? 'Enviando…' : 'Continuar'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center mb-2">
            <p className="text-ink-secondary text-sm">
              Código enviado a{' '}
              <span className="text-ink-primary font-medium">
                +56 {phone}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-secondary mb-2">
              Código SMS
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className={cn('input text-center text-2xl tracking-[0.5em] font-bold')}
              autoFocus
              required
            />
          </div>

          {error && (
            <p className="text-danger text-sm animate-fade-in">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="btn-primary w-full"
          >
            {loading ? 'Verificando…' : 'Ingresar'}
          </button>

          <button
            type="button"
            onClick={() => { setStep('phone'); setOtp(''); setError(null) }}
            className="btn-ghost w-full text-sm"
          >
            Cambiar número
          </button>
        </form>
      )}
    </div>
  )
}
