import QRCode from 'qrcode'
import {
  supabase,
  BUCKET_QR
} from './supabase.service'

export async function generateAndStoreQRCode(
  weddingId: string,
  invitationUrl: string
) {

  const qrBase64 =
    await QRCode.toDataURL(invitationUrl)

  const base64 =
    qrBase64.replace(
      /^data:image\/png;base64,/,
      ''
    )

  const buffer =
    Buffer.from(base64, 'base64')

  const fileName =
    `wedding-${weddingId}.png`

  const { error } =
    await supabase.storage
      .from(BUCKET_QR)
      .upload(fileName, buffer, {
        contentType: 'image/png',
        upsert: true
      })

  if (error) {
    throw error
  }

  const { data } =
    supabase.storage
      .from(BUCKET_QR)
      .getPublicUrl(fileName)

  return data.publicUrl
}