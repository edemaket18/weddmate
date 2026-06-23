import { Request, Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import fs from 'fs'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
const BUCKET = process.env.BUCKET_NAME || 'weddmate-photos'
const BUCKET_URL = process.env.BUCKET_URL || ''

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })


export const getGaleriePage = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const wedding = await prisma.wedding.findUnique({ where: { slug } })

    const htmlPath = path.join(process.cwd(), 'public', 'galerie.html')
    let html = fs.readFileSync(htmlPath, 'utf-8')

    if (!wedding) {
      html = html.replace('__GALERIE_DATA__', JSON.stringify({
        error: 'Mariage introuvable',
        galerieOuverte: false,
        photos: [],
      }))
      return res.status(404).send(html)
    }

    if (!wedding.galerieOuverte) {
      html = html.replace('__GALERIE_DATA__', JSON.stringify({
        error: 'La galerie n\'est pas encore ouverte',
        galerieOuverte: false,
        nomCeremonie: wedding.nomCeremonie,
        photos: [],
      }))
      return res.status(200).send(html)
    }

    const photos = await prisma.photoGalerie.findMany({
      where: { weddingId: wedding.id, validee: true },
      orderBy: { createdAt: 'desc' },
    })

    const data = {
      galerieOuverte: true,
      nomCeremonie: wedding.nomCeremonie,
      dateJourJ: wedding.dateJourJ,
      lieuCeremonie: wedding.lieuCeremonie,
      slug: wedding.slug,
      photos,
      total: photos.length,
    }
    html = html.replace('__GALERIE_DATA__', JSON.stringify(data))
    return res.status(200).send(html)

  } catch (error) {
    console.error('[getGaleriePage]', error)
    return res.status(500).send('<h1>Erreur serveur</h1>')
  }
}

// Upload depuis navigateur (base64) ou app mobile (url directe)
export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const { url, thumbnailUrl, uploadePar, caption, taille, imageBase64, mimeType } = req.body

    const wedding = await prisma.wedding.findUnique({ where: { slug } })
    if (!wedding) return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    if (!wedding.galerieOuverte) return res.status(403).json({ success: false, error: 'La galerie n\'est pas ouverte' })

    // Validation avant upload
    if (taille && taille > 10 * 1024 * 1024)
      return res.status(400).json({ success: false, error: 'Photo limitée à 10 Mo.' })

    let finalUrl = url
    let finalThumbUrl = thumbnailUrl

    if (imageBase64 && !url) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
      if (mimeType && !allowedTypes.includes(mimeType.toLowerCase()))
        return res.status(400).json({ success: false, error: 'Format non autorisé. Utilisez JPG, PNG ou WebP.' })

      const ext = (mimeType || 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
      const fileName = `${slug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(imageBase64, 'base64')

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, buffer, { contentType: mimeType || 'image/jpeg', upsert: false })

      if (uploadError) {
        console.error('[Supabase]', uploadError)
        return res.status(500).json({ success: false, error: `Erreur upload: ${uploadError.message}` })
      }

      finalUrl = `${BUCKET_URL}/${fileName}`
      finalThumbUrl = finalUrl
    }

    if (!finalUrl) return res.status(400).json({ success: false, error: 'URL ou image requise' })

    const photo = await prisma.photoGalerie.create({
      data: {
        weddingId: wedding.id,
        url: finalUrl,
        thumbnailUrl: finalThumbUrl ?? null,
        taille: taille ?? null,
        uploadePar: uploadePar ?? null,
        caption: caption ?? null,
        validee: true,
      },
    })

    return res.status(201).json({ success: true, data: photo })
  } catch (error) {
    console.error('[uploadPhoto]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const modererPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, photoId } = req.params
    const { validee } = req.body
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    const photo = await prisma.photoGalerie.findUnique({ where: { id: photoId } })
    if (!photo || photo.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Photo introuvable' })
    const updated = await prisma.photoGalerie.update({ where: { id: photoId }, data: { validee: Boolean(validee) } })
    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, photoId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    const photo = await prisma.photoGalerie.findUnique({ where: { id: photoId } })
    if (!photo || photo.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Photo introuvable' })
    if (photo.url.includes(BUCKET_URL) && BUCKET_URL) {
      const filePath = photo.url.replace(`${BUCKET_URL}/`, '')
      await supabase.storage.from(BUCKET).remove([filePath]).catch(() => {})
    }
    await prisma.photoGalerie.delete({ where: { id: photoId } })
    return res.status(200).json({ success: true, data: { message: 'Photo supprimée' } })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const getGalerieData = getGaleriePage


/*import { Request, Response } from 'express'
import path from 'path'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'
import { BUCKET_PHOTOS, supabase } from '../services/supabase.service'

const BUCKET = BUCKET_PHOTOS
const MAX_PHOTO_SIZE = 10 * 1024 * 1024

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })

export const getGaleriePage = async (req: Request, res: Response) => {
  try {
    const acceptsHtml = req.headers.accept?.includes('text/html')
    if (acceptsHtml) {
      // Toujours servir la page HTML au navigateur,
      // peu importe si la galerie est ouverte ou non.
      // La page HTML gère elle-même l'état fermé.
      return res.sendFile(path.join(process.cwd(), 'public', 'galerie.html'))
    }

    // JSON pour app mobile
    const { slug } = req.params
    const wedding = await prisma.wedding.findUnique({ where: { slug } })
    if (!wedding) return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    if (!wedding.galerieOuverte) return res.status(403).json({ success: false, error: 'Galerie non ouverte' })

    const photos = await prisma.photoGalerie.findMany({
      where: { weddingId: wedding.id, validee: true },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(200).json({
      success: true,
      data: { nomCeremonie: wedding.nomCeremonie, dateJourJ: wedding.dateJourJ, lieuCeremonie: wedding.lieuCeremonie, lieuReception: wedding.lieuReception, photos, total: photos.length },
    })
  } catch (error) {
    console.error('[getGaleriePage]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const getGalerieData = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const wedding = await prisma.wedding.findUnique({ where: { slug } })

    if (!wedding) return res.status(404).json({ success: false, error: 'Mariage introuvable' })

    if (!wedding.galerieOuverte) {
      return res.status(200).json({
        success: false,
        galerieOuverte: false,
        error: 'La galerie n\'est pas encore ouverte',
        data: {
          nomCeremonie: wedding.nomCeremonie,
          dateJourJ: wedding.dateJourJ,
          galerieOuverte: false,
          photos: [],
          total: 0,
        },
      })
    }

    const photos = await prisma.photoGalerie.findMany({
      where: { weddingId: wedding.id, validee: true },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({
      success: true,
      data: {
        nomCeremonie: wedding.nomCeremonie,
        dateJourJ: wedding.dateJourJ,
        heureCeremonie: wedding.heureCeremonie,
        heureReception: wedding.heureReception,
        lieuCeremonie: wedding.lieuCeremonie,
        lieuReception: wedding.lieuReception,
        galerieOuverte: true,
        photos,
        total: photos.length,
      },
    })
  } catch (error) {
    console.error('[getGalerieData]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const getGalerieOwnerData = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params

    if (!await checkAccess(weddingId, req.user!.id)) {
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    }

    const photos = await prisma.photoGalerie.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'desc' },
    })

    return res.status(200).json({
      success: true,
      data: {
        photos,
        total: photos.length,
        visibles: photos.filter(photo => photo.validee).length,
        enAttente: photos.filter(photo => !photo.validee).length,
      },
    })
  } catch (error) {
    console.error('[getGalerieOwnerData]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const { url, thumbnailUrl, uploadePar, caption, taille, imageBase64, mimeType } = req.body

    const wedding = await prisma.wedding.findUnique({ where: { slug } })
    if (!wedding) return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    if (!wedding.galerieOuverte) return res.status(403).json({ success: false, error: 'La galerie n\'est pas ouverte' })

    // FIX: validation AVANT l'upload Supabase
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
    if (imageBase64 && mimeType && !allowedTypes.includes(mimeType.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'Format non autorisé. Utilisez JPG, PNG ou WebP.' })
    }
    if (taille && taille > MAX_PHOTO_SIZE) {
      return res.status(400).json({ success: false, error: 'Photo limitée à 10 Mo.' })
    }

    let finalUrl: string | undefined
    let finalThumbUrl: string | null | undefined

    // Upload base64 depuis navigateur web
    if (imageBase64 && !url) {
      const ext = (mimeType || 'image/jpeg').split('/')[1]?.replace('jpeg', 'jpg') || 'jpg'
      const fileName = `${slug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const buffer = Buffer.from(imageBase64, 'base64')

      if (buffer.length > MAX_PHOTO_SIZE) {
        return res.status(400).json({ success: false, error: 'Photo limitée à 10 Mo.' })
      }

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('[Supabase upload]', uploadError)
        return res.status(500).json({ success: false, error: `Erreur Supabase : ${uploadError.message}` })
      }

      finalUrl = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl
      finalThumbUrl = finalUrl
    } else if (url) {
      const publicBase = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl.replace(/\/$/, '')
      const isBucketUrl = typeof url === 'string' && url.startsWith(`${publicBase}/`)
      const isBucketThumb = !thumbnailUrl || (typeof thumbnailUrl === 'string' && thumbnailUrl.startsWith(`${publicBase}/`))

      if (!isBucketUrl || !isBucketThumb) {
        return res.status(400).json({ success: false, error: 'URL Supabase invalide pour cette galerie' })
      }

      finalUrl = url
      finalThumbUrl = thumbnailUrl ?? null
    }

    if (!finalUrl) return res.status(400).json({ success: false, error: 'URL ou image requise' })

    const photo = await prisma.photoGalerie.create({
      data: {
        weddingId: wedding.id,
        url: finalUrl,
        thumbnailUrl: finalThumbUrl ?? null,
        taille: taille ?? null,
        uploadePar: uploadePar ?? null,
        caption: caption ?? null,
        validee: false,
      },
    })

    return res.status(201).json({ success: true, data: photo })
  } catch (error) {
    console.error('[uploadPhoto]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const modererPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, photoId } = req.params
    const { validee } = req.body
    if (!await checkAccess(weddingId, req.user!.id)) return res.status(403).json({ success: false, error: 'Accès refusé' })
    const photo = await prisma.photoGalerie.findUnique({ where: { id: photoId } })
    if (!photo || photo.weddingId !== weddingId) return res.status(404).json({ success: false, error: 'Photo introuvable' })
    const updated = await prisma.photoGalerie.update({ where: { id: photoId }, data: { validee: Boolean(validee) } })
    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, photoId } = req.params
    if (!await checkAccess(weddingId, req.user!.id)) return res.status(403).json({ success: false, error: 'Accès refusé' })
    const photo = await prisma.photoGalerie.findUnique({ where: { id: photoId } })
    if (!photo || photo.weddingId !== weddingId) return res.status(404).json({ success: false, error: 'Photo introuvable' })
    const publicBase = supabase.storage.from(BUCKET).getPublicUrl('').data.publicUrl.replace(/\/$/, '')
    if (photo.url.startsWith(`${publicBase}/`)) {
      const filePath = photo.url.replace(`${publicBase}/`, '')
      await supabase.storage.from(BUCKET).remove([filePath]).catch(() => {})
    }
    await prisma.photoGalerie.delete({ where: { id: photoId } })
    return res.status(200).json({ success: true, data: { message: 'Photo supprimée' } })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}
*/