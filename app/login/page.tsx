export const dynamic = 'force-dynamic'

import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-surface-base flex flex-col items-center justify-center px-6">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand/20 mb-4">
          <span className="text-3xl">🚗</span>
        </div>
        <h1 className="text-3xl font-bold gradient-text">UnCupo</h1>
        <p className="text-ink-secondary mt-2 text-sm">
          Viña del Mar ↔ Santiago
        </p>
      </div>

      <LoginForm />

      <p className="mt-8 text-xs text-ink-muted text-center max-w-xs">
        Al ingresar aceptas los términos de uso.
        Sin WhatsApp, sin intermediarios.
      </p>
    </main>
  )
}
