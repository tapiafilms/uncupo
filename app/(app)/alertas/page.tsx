export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AlertaForm } from './AlertaForm'
import { AlertasList } from './AlertasList'
import { AppHeader } from '@/components/layout/AppHeader'

export default async function AlertasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: alertas } = await supabase
    .from('alertas')
    .select('*')
    .eq('pasajero_id', user.id)
    .order('activa', { ascending: false })

  return (
    <div className="page-container">
      <AppHeader />
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ink-primary">Mis Alertas</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Te avisamos cuando aparezca un viaje que te interesa
        </p>
      </div>

      <AlertaForm userId={user.id} />

      <div className="mt-6">
        <AlertasList alertas={alertas ?? []} />
      </div>
    </div>
  )
}
