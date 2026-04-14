'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { uploadAvatar } from '@/lib/storage'
import { useRouter } from 'next/navigation'

interface Props {
  userId: string
  nombre: string
  fotoUrl: string | null
}

export function AvatarUpload({ userId, nombre, fotoUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(fotoUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Instant local preview
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)
    setLoading(true)
    setError(null)

    try {
      const url = await uploadAvatar(userId, file)
      await supabase.from('users').update({ foto_url: url }).eq('id', userId)
      setPreview(url)
      router.refresh()
    } catch {
      setPreview(fotoUrl)
      setError('No se pudo subir la foto')
    } finally {
      setLoading(false)
      // Reset input so the same file can be re-selected
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative w-20 h-20 rounded-full overflow-hidden group shrink-0"
        disabled={loading}
      >
        {preview ? (
          <img
            src={preview}
            alt={nombre}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-brand/20 flex items-center justify-center text-2xl font-bold text-brand">
            {nombre?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        {/* Hover / loading overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity bg-black/50
          ${loading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          {loading
            ? <Loader2 size={22} className="text-white animate-spin" />
            : <Camera size={22} className="text-white" />
          }
        </div>
      </button>

      {error && <p className="text-danger text-xs mt-1">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
