'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'

export function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rotated, setRotated] = useState(false)

  function handleRefresh() {
    setRotated(true)
    startTransition(() => {
      router.refresh()
    })
    setTimeout(() => setRotated(false), 600)
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isPending}
      className="flex items-center gap-1.5 text-xs font-semibold text-brand disabled:opacity-50 transition-opacity"
    >
      <RefreshCw
        size={13}
        className={`transition-transform duration-500 ${rotated ? 'rotate-180' : ''}`}
      />
      {isPending ? 'Actualizando…' : 'Actualizar'}
    </button>
  )
}
