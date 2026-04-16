export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nombre, sector')
    .eq('id', user.id)
    .single()

  // Si ya tiene nombre, saltar al home
  if (profile?.nombre) {
    redirect('/home')
  }

  return (
    <main className="min-h-dvh bg-surface-base flex flex-col items-center justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <img src="/logo.png" alt="UnCupo" className="h-16 w-auto object-contain mx-auto mb-3" />
        <h1 className="text-xl font-bold text-ink-primary">Completa tu perfil</h1>
        <p className="text-ink-muted text-sm mt-1">Solo un momento más</p>
      </div>
      <OnboardingForm userId={user.id} />
    </main>
  )
}
