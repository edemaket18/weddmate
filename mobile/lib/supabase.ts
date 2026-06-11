import { createClient } from '@supabase/supabase-js'

export const BUCKET_NAME = process.env.EXPO_PUBLIC_BUCKET_NAME!
export const BUCKET_URL = process.env.EXPO_PUBLIC_BUCKET_URL!

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

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

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, arrayBuffer, {
      contentType: blob.type || 'image/jpeg',
      upsert: false,
    })

  if (error) throw new Error(`Upload Supabase échoué : ${error.message}`)

  const url = `${BUCKET_URL}/${fileName}`
  const thumbnailUrl = url 

  return { url, thumbnailUrl, taille }
}
