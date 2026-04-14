import webpush from 'web-push'

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT ?? 'mailto:hola@uncupo.cl',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  url?: string
  tag?: string
}

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    return true
  } catch (err: any) {
    // 410 = subscription expired/invalid
    if (err.statusCode === 410 || err.statusCode === 404) {
      return false // caller should delete subscription
    }
    console.error('Push error:', err.message)
    return false
  }
}

export { webpush }
