import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'
import { sendPushNotification, type PushPayload } from '@/lib/webpush'

// Only callable from server (service role)
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, payload }: { userId: string; payload: PushPayload } = await req.json()
  if (!userId || !payload) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', userId)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  const expired: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      const ok = await sendPushNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      if (ok) sent++
      else expired.push(sub.endpoint)
    })
  )

  // Clean up expired subscriptions
  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', expired)
  }

  return NextResponse.json({ sent, expired: expired.length })
}
