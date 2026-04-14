'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="btn-ghost flex items-center gap-2 text-ink-muted text-sm"
    >
      <LogOut size={16} />
      Salir
    </button>
  )
}
