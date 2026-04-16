export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { DbVehiculo } from '@/lib/types'
import { VehiculosClient } from './VehiculosClient'

interface PageProps {
  searchParams: Promise<{ next?: string }>
}

export default async function VehiculosPage({ searchParams }: PageProps) {
  const { next } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehiculos } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('user_id', user.id)
    .order('patente', { ascending: true })

  return (
    <VehiculosClient
      userId={user.id}
      vehiculos={(vehiculos ?? []) as DbVehiculo[]}
      next={next}
    />
  )
}
