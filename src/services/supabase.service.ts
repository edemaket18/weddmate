import { createClient } from '@supabase/supabase-js'

const requireEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Variable d'environnement manquante: ${key}`)
  }
  return value
}

export const BUCKET_PHOTOS = process.env.BUCKET_NAME || 'weddmate-photos'
export const BUCKET_QR = process.env.BUCKET_QR || 'weddmate-qrcodes'

export const supabase = createClient(
  requireEnv('SUPABASE_URL'),
  requireEnv('SUPABASE_SERVICE_KEY')
)

export const uploadPhoto = async (file: Buffer, path: string) => {
  const { error } = await supabase.storage
    .from(BUCKET_PHOTOS)
    .upload(path, file, { contentType: 'image/jpeg' })

  if (error) throw error

  return supabase.storage.from(BUCKET_PHOTOS).getPublicUrl(path).data.publicUrl
}
