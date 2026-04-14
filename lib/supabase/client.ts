import { createBrowserClient } from '@supabase/ssr'

// Singleton — una sola instancia y una sola conexión WebSocket por sesión
let instance: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (!instance) {
    instance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return instance
}
