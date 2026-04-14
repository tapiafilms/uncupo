'use client'

import { useState } from 'react'
import { Edit2 } from 'lucide-react'
import { EditProfileForm } from './EditProfileForm'

export function ProfileEditWrapper({ userId, nombre }: { userId: string; nombre: string }) {
  const [editing, setEditing] = useState(false)

  if (editing) {
    return <EditProfileForm userId={userId} nombre={nombre} onCancel={() => setEditing(false)} />
  }

  return (
    <div className="flex items-center gap-2">
      <p className="font-bold text-ink-primary text-lg truncate">
        {nombre || 'Agrega tu nombre'}
      </p>
      <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-brand transition-colors">
        <Edit2 size={14} />
      </button>
    </div>
  )
}
