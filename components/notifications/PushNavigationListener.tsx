'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Escucha mensajes del Service Worker del tipo SW_NAVIGATE
 * y usa el router de Next.js para navegar sin recargar la página.
 */
export function PushNavigationListener() {
  const router = useRouter()

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return

    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'SW_NAVIGATE' && event.data?.url) {
        router.push(event.data.url)
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [router])

  return null
}
