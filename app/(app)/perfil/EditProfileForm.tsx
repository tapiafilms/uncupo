'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Check, X } from 'lucide-react'

interface Props {
  userId: string
  nombre: string
  onCancel: () => void
}

export function EditProfileForm({ userId, nombre, onCancel }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [value, setValue] = useState(nombre)
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    if (!value.trim()) return
    setLoading(true)
    await supabase.from('users').update({ nombre: value.trim() }).eq('id', userId)
    setLoading(false)
    onCancel()
    router.refresh()
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        className="input flex-1 py-2 text-sm"
        placeholder="Tu nombre"
        autoFocus
        maxLength={50}
      />
      <button
        onClick={handleSave}
        disabled={loading || !value.trim()}
        className="w-9 h-9 rounded-xl bg-success/20 text-success flex items-center justify-center"
      >
        <Check size={16} />
      </button>
      <button
        onClick={onCancel}
        className="w-9 h-9 rounded-xl bg-surface-overlay text-ink-muted flex items-center justify-center"
      >
        <X size={16} />
      </button>
    </div>
  )
}
