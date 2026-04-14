import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PublishForm } from './PublishForm'

export default async function PublicarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's vehicles
  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('user_id', user.id)

  return (
    <div className="page-container">
      <div className="pt-2 mb-6">
        <h1 className="text-2xl font-bold text-ink-primary">Publicar Viaje</h1>
        <p className="text-sm text-ink-secondary mt-1">
          Completa los datos — otros verán tu viaje al instante
        </p>
      </div>

      <PublishForm
        userId={user.id}
        vehiculos={vehiculos ?? []}
      />
    </div>
  )
}
