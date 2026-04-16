export const dynamic = 'force-dynamic'

import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="min-h-dvh bg-surface-base flex flex-col items-center justify-center px-6">
      {/* Logo / Brand */}
      <div className="mb-10 text-center">
        <img src="/logo.png" alt="UnCupo" className="h-20 w-auto object-contain mx-auto mb-4" />
        <p className="text-ink-secondary mt-2 text-sm">
          Montemar ↔ Santiago
        </p>
        <p className="text-ink-muted mt-1 text-xs">
          Ingresa con tu cuenta
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
