'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    })

    setLoading(false)

    if (error) {
      setError('Email o contraseña incorrectos.')
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          Email
        </label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
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

      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">
          Contraseña
        </label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="input pl-10 pr-10"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted"
            tabIndex={-1}
          >
            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-danger text-sm animate-fade-in">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !email.includes('@') || password.length < 1}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? 'Ingresando…' : (
          <>
            Ingresar
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <div className="text-center pt-2">
        <p className="text-sm text-ink-muted">
          ¿No tienes cuenta?{' '}
          <Link href="/registro" className="text-brand font-semibold hover:underline">
            Crear cuenta
          </Link>
        </p>
      </div>
    </form>
  )
}
