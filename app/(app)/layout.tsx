import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/layout/BottomNav'
import { PageTransition } from '@/components/layout/PageTransition'
import { PushNavigationListener } from '@/components/notifications/PushNavigationListener'
import { PushAutoSubscribe } from '@/components/notifications/PushAutoSubscribe'
import { GlobalNotificationListener } from '@/components/notifications/GlobalNotificationListener'

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
      <PushNavigationListener />
      <PushAutoSubscribe userId={user.id} />
      <GlobalNotificationListener userId={user.id} />
      <main>
        <PageTransition>
          {children}
        </PageTransition>
      </main>
      <BottomNav />
    </div>
  )
}
