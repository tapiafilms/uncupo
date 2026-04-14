import { createClient } from '@/lib/supabase/client'

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient()
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/avatar.${ext}`

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw error

  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  // Cache buster so the new image appears immediately
  return `${data.publicUrl}?t=${Date.now()}`
}

export async function uploadVehiculoFoto(
  userId: string,
  vehiculoId: string,
  file: File,
): Promise<string> {
  const supabase = createClient()
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/${vehiculoId}.${ext}`

  const { error } = await supabase.storage
    .from('vehiculos')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (error) throw error

  const { data } = supabase.storage.from('vehiculos').getPublicUrl(path)
  return `${data.publicUrl}?t=${Date.now()}`
}
