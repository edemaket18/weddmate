 import { createClient } from '@supabase/supabase-js' 
 
 const supabase = createClient( process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY! ) 
 
 export const uploadPhoto = async (file: Buffer, path: string) => { 
  const { data, error } = await supabase.storage .from('weddmate-photos') .upload(path, file, { contentType: 'image/jpeg' }) 
  if (error) throw error 
  return supabase.storage.from('weddmate-photos').getPublicUrl(path).data.publicUrl }