import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { createClient } from '@supabase/supabase-js'
import path from 'path'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'

//const prisma = new PrismaClient()

//Supabase client pour gérer les uploads de photos depuis le navigateur (base64) et les supprimer si besoin
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)
const BUCKET = process.env.BUCKET_NAME || 'weddmate-photos'
const BUCKET_URL = process.env.BUCKET_URL || ''

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })

// C'est ce que le QR Code ouvre dans le navigateur de l'invité
export const getGaleriePage = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const wedding = await prisma.wedding.findUnique({ where: { slug } })

    if (!wedding) {
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    }

    // Accepte HTML ou JSON selon le header Accept
    const acceptsHtml = req.headers.accept?.includes('text/html')

    if (acceptsHtml) {
      // Servir la page HTML pour le navigateur (QR Code)
      return res.sendFile(path.join(process.cwd(), 'public', 'galerie.html')
)  
    }

    // Sinon retourner le JSON pour l'app mobile
    if (!wedding.galerieOuverte) {
      return res.status(403).json({ success: false, error: 'La galerie n\'est pas encore ouverte' })
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
        photos,
        total: photos.length,
      },
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

    if (!wedding) {
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    }

    if (!wedding.galerieOuverte) {
      return res.status(403).json({ success: false, error: 'La galerie n\'est pas encore ouverte' })
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
        lieuCeremonie: wedding.lieuCeremonie,
        lieuReception: wedding.lieuReception,
        photos,
        total: photos.length,
      },
    })
  } catch (error) {
    console.error('[getGalerieData]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

//url directe depuis l'app mobile après upload Supabase côté client
export const uploadPhoto = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const { url, thumbnailUrl, uploadePar, caption, taille, imageBase64, mimeType } = req.body

    const wedding = await prisma.wedding.findUnique({ where: { slug } })
    if (!wedding) {
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    }
    if (!wedding.galerieOuverte) {
      return res.status(403).json({ success: false, error: 'La galerie n\'est pas ouverte' })
    }

    let finalUrl = url
    let finalThumbUrl = thumbnailUrl

    if (imageBase64 && !url) {
      const ext = (mimeType || 'image/jpeg').split('/')[1] || 'jpg'
      const fileName = `${slug}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

      // Convertir base64 en Buffer
      const buffer = Buffer.from(imageBase64, 'base64')

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: false,
        })

      if (uploadError) {
        console.error('[Supabase upload]', uploadError)
        return res.status(500).json({
          success: false,
          error: `Erreur Supabase : ${uploadError.message}`,
        })
      }

      finalUrl = `${BUCKET_URL}/${fileName}`
      finalThumbUrl = finalUrl
    }

    if (!finalUrl) {
      return res.status(400).json({ success: false, error: 'URL ou image requise' })
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ]

    if (!allowedTypes.includes(mimeType)) {
      return res.status(400).json({
        success: false,
        error: 'Format non autorisé'
      })
    }
    if (taille > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Photo limitée à 5 Mo'
      })
    }

    //Enregistrement dans la base
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

    if (!await checkAccess(weddingId, req.user!.id)) {
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    }

    const photo = await prisma.photoGalerie.findUnique({ where: { id: photoId } })
    if (!photo || photo.weddingId !== weddingId) {
      return res.status(404).json({ success: false, error: 'Photo introuvable' })
    }

    const updated = await prisma.photoGalerie.update({
      where: { id: photoId },
      data: { validee: Boolean(validee) },
    })

    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('[modererPhoto]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const deletePhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, photoId } = req.params

    if (!await checkAccess(weddingId, req.user!.id)) {
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    }

    const photo = await prisma.photoGalerie.findUnique({ where: { id: photoId } })
    if (!photo || photo.weddingId !== weddingId) {
      return res.status(404).json({ success: false, error: 'Photo introuvable' })
    }

    if (photo.url.includes(BUCKET_URL)) {
      const filePath = photo.url.replace(`${BUCKET_URL}/`, '')
      await supabase.storage.from(BUCKET).remove([filePath]).catch(() => {})
    }

    await prisma.photoGalerie.delete({ where: { id: photoId } })
    return res.status(200).json({ success: true, data: { message: 'Photo supprimée' } })
  } catch (error) {
    console.error('[deletePhoto]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}