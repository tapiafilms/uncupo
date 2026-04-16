'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, User, MapPin, Phone, ArrowRight, Eye, EyeOff, CheckCircle, Car } from 'lucide-react'
import Link from 'next/link'
import { SECTORES } from '@/lib/types'

type Step = 'datos' | 'rol' | 'enviado' | 'lleno'

export function RegisterForm() {
  const supabase = createClient()
  const router = useRouter()

  const [step, setStep] = useState<Step>('datos')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [sector, setSector] = useState('')
  const [telefono, setTelefono] = useState('')
  const [esChofer, setEsChofer] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Paso 1: validar y avanzar ──────────────────────────────
  function handleNextStep(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!sector) {
      setError('Selecciona tu sector.')
      return
    }

    setStep('rol')
  }

  // ── Paso 2: crear cuenta ───────────────────────────────────
  async function handleRegistrar() {
    setError(null)
    setLoading(true)

    // Verificar límite de usuarios antes de crear la cuenta
    try {
      const res  = await fetch('/api/auth/check-limit')
      const data = await res.json()
      if (!data.permitido) {
        setLoading(false)
        setStep('lleno')
        return
      }
    } catch {
      // Si falla el check, dejamos pasar (mejor experiencia que bloquear por error de red)
    }

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { nombre: nombre.trim(), sector, telefono: telefono.trim() },
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
      },
    })

    if (error) {
      setLoading(false)
      if (error.message.includes('already registered')) {
        setError('Ya existe una cuenta con ese email. Ingresa desde Login.')
      } else {
        setError('No se pudo crear la cuenta. Intenta nuevamente.')
      }
      setStep('datos')
      return
    }

    // Si hay sesión activa (confirmación de email desactivada en Supabase)
    // → guardar perfil y redirigir directo
    if (signUpData.session) {
      const userId = signUpData.user?.id
      if (userId) {
        await supabase
          .from('users')
          .update({ nombre: nombre.trim(), sector, telefono: telefono.trim() })
          .eq('id', userId)
      }
      router.push(esChofer ? '/vehiculos' : '/home')
      router.refresh()
      return
    }

    // Sin sesión → requiere confirmar email
    setLoading(false)
    setStep('enviado')
  }

  // ── Pantalla: límite alcanzado ────────────────────────────
  if (step === 'lleno') {
    return (
      <div className="w-full max-w-sm text-center animate-slide-up space-y-4">
        <div className="w-16 h-16 rounded-full bg-warning/20 flex items-center justify-center mx-auto">
          <span className="text-3xl">🚦</span>
        </div>
        <h2 className="text-lg font-bold text-ink-primary">Estamos al límite por ahora</h2>
        <p className="text-ink-secondary text-sm">
          UNcupo está en fase beta y hemos alcanzado el máximo de usuarios por el momento.
        </p>
        <p className="text-ink-muted text-xs">
          Estamos trabajando para abrir más cupos pronto. Si ya tienes cuenta,{' '}
          <Link href="/login" className="text-brand font-semibold">ingresa aquí</Link>.
        </p>
      </div>
    )
  }

  // ── Pantalla: email enviado ────────────────────────────────
  if (step === 'enviado') {
    return (
      <div className="w-full max-w-sm text-center animate-slide-up space-y-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle size={32} className="text-success" />
        </div>
        <h2 className="text-lg font-bold text-ink-primary">¡Casi listo!</h2>
        <p className="text-ink-secondary text-sm">
          Enviamos un link de confirmación a{' '}
          <span className="text-ink-primary font-semibold">{email}</span>
        </p>
        <p className="text-ink-muted text-xs">
          Haz clic en el link del email para activar tu cuenta.
          Puede tardar hasta 1 minuto.
        </p>
        <button
          onClick={() => { setStep('datos'); setError(null) }}
          className="btn-ghost w-full text-sm"
        >
          Usar otro email
        </button>
      </div>
    )
  }

  // ── Paso 2: rol ───────────────────────────────────────────
  if (step === 'rol') {
    return (
      <div className="w-full max-w-sm space-y-5 animate-slide-up">
        <div className="text-center mb-2">
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Paso 2 de 2</p>
          <h2 className="text-lg font-bold text-ink-primary">¿Cómo vas a usar UNcupo?</h2>
        </div>

        {/* Pasajero (siempre) */}
        <div className="card p-4 border-success/40 bg-success/5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎫</span>
            <div>
              <p className="font-semibold text-ink-primary text-sm">Pasajero</p>
              <p className="text-xs text-ink-muted mt-0.5">Busca viajes y reserva cupos disponibles</p>
            </div>
            <CheckCircle size={18} className="text-success ml-auto mt-0.5 shrink-0" />
          </div>
        </div>

        {/* Chofer (opcional) */}
        <button
          type="button"
          onClick={() => setEsChofer(!esChofer)}
          className={`card p-4 w-full text-left transition-all ${
            esChofer ? 'border-brand/50 bg-brand/5' : ''
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">🚗</span>
            <div className="flex-1">
              <p className="font-semibold text-ink-primary text-sm">Chofer (opcional)</p>
              <p className="text-xs text-ink-muted mt-0.5">Publica viajes y lleva pasajeros</p>
              {esChofer && (
                <p className="text-xs text-brand mt-1.5">
                  Podrás agregar tu vehículo después de crear la cuenta
                </p>
              )}
            </div>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
              esChofer ? 'border-brand bg-brand' : 'border-surface-border'
            }`}>
              {esChofer && <div className="w-2 h-2 rounded-full bg-white" />}
            </div>
          </div>
        </button>

        {error && (
          <p className="text-danger text-sm animate-fade-in text-center">{error}</p>
        )}

        <button
          onClick={handleRegistrar}
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {loading ? 'Creando cuenta…' : (
            <>
              Crear cuenta
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setStep('datos')}
          className="btn-ghost w-full text-sm"
        >
          ← Volver
        </button>
      </div>
    )
  }

  // ── Paso 1: datos básicos ──────────────────────────────────
  return (
    <form onSubmit={handleNextStep} className="w-full max-w-sm space-y-4">
      <div className="text-center mb-2">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-1">Paso 1 de 2</p>
        <h2 className="text-lg font-bold text-ink-primary">Tus datos</h2>
      </div>

      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">Nombre</label>
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

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">Email</label>
        <div className="relative">
          <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            className="input pl-10"
            autoComplete="email"
            required
          />
        </div>
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">Contraseña</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="input pl-10 pr-10"
            autoComplete="new-password"
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

      {/* Confirmar contraseña */}
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">Confirmar contraseña</label>
        <div className="relative">
          <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type={showPass ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite tu contraseña"
            className="input pl-10"
            autoComplete="new-password"
            required
          />
        </div>
      </div>

      {/* Sector */}
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

      {/* Teléfono */}
      <div>
        <label className="block text-sm font-medium text-ink-secondary mb-2">Teléfono</label>
        <div className="relative">
          <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="tel"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="+56 9 1234 5678"
            className="input pl-10"
            autoComplete="tel"
            required
          />
        </div>
      </div>

      {error && (
        <p className="text-danger text-sm animate-fade-in">{error}</p>
      )}

      <button
        type="submit"
        disabled={!nombre.trim() || !email.includes('@') || password.length < 1 || !confirmPassword || !sector || !telefono.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        Continuar
        <ArrowRight size={16} />
      </button>

      <div className="text-center pt-2">
        <p className="text-sm text-ink-muted">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </form>
  )
}
