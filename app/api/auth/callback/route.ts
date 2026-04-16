import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/home'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from('users')
        .select('id, nombre')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        // Perfil no creado por el trigger — crearlo con metadata del registro
        const nombre   = data.user.user_metadata?.nombre || data.user.email?.split('@')[0] || ''
        const sector   = data.user.user_metadata?.sector || ''
        const telefono = data.user.user_metadata?.telefono || ''

        await supabase.from('users').insert({
          id: data.user.id,
          nombre,
          sector,
          telefono,
        })
      } else if (!profile.nombre) {
        // Perfil existe pero sin nombre — actualizar con metadata
        const nombre   = data.user.user_metadata?.nombre || ''
        const sector   = data.user.user_metadata?.sector || ''
        const telefono = data.user.user_metadata?.telefono || ''

        if (nombre) {
          await supabase
            .from('users')
            .update({ nombre, sector, telefono })
            .eq('id', data.user.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
