import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PublishForm } from './PublishForm'
import { Car, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function PublicarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's vehicles
  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('user_id', user.id)

  // Sin vehículo → pedir que agregue su auto primero
  if (!vehiculos || vehiculos.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mb-5">
          <Car size={36} className="text-brand" />
        </div>
        <h1 className="text-xl font-bold text-ink-primary">Primero, registra tu auto</h1>
        <p className="text-ink-secondary text-sm mt-2 max-w-xs">
          Para publicar viajes necesitas tener al menos un vehículo registrado.
          Solo toma un momento.
        </p>
        <Link
          href="/vehiculos?next=/publicar"
          className="btn-primary mt-8 flex items-center gap-2 px-6"
        >
          Agregar mi auto
          <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

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
