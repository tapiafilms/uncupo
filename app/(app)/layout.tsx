export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import { PublishFAB } from '@/components/layout/PublishFAB'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="relative min-h-dvh bg-surface-base">
      <main>{children}</main>
      <PublishFAB />
      <BottomNav />
    </div>
  )
}
