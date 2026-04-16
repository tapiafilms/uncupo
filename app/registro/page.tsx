export const dynamic = 'force-dynamic'

import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegistroPage() {
  return (
    <main className="min-h-dvh bg-surface-base flex flex-col items-center justify-center px-6 py-10">
      {/* Logo / Brand */}
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="UnCupo" className="h-16 w-auto object-contain mx-auto mb-3" />
        <p className="text-ink-secondary text-sm">Únete a la comunidad</p>
        <p className="text-ink-muted text-xs mt-0.5">Montemar ↔ Santiago</p>
      </div>

      <RegisterForm />
    </main>
  )
}
