import { createClient } from '@supabase/supabase-js'

const requireExpoEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`${key} est requis pour configurer Supabase`)
  }
  return value
}

export const BUCKET_NAME = requireExpoEnv('EXPO_PUBLIC_BUCKET_NAME')

const SUPABASE_URL = requireExpoEnv('EXPO_PUBLIC_SUPABASE_URL')
const SUPABASE_ANON_KEY = requireExpoEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY')

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
)

export const uploadPhotoToSupabase = async (
  localUri: string,
  weddingSlug: string,
  uploadePar: string = 'Invité'
): Promise<{ url: string; thumbnailUrl: string; taille: number }> => {

  const response = await fetch(localUri)
  const blob = await response.blob()
  const taille = blob.size

  const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg'
  const fileName = `${weddingSlug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await blob.arrayBuffer()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, arrayBuffer, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    })

  if (error) throw new Error(`Upload Supabase échoué : ${error.message}`)

  const url = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName).data.publicUrl
  const thumbnailUrl = url 

  return { url, thumbnailUrl, taille }
}
