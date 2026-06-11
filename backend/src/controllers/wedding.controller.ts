 import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import QRCode from 'qrcode'
import { AuthRequest } from '../types'
import { CreateWeddingInput, UpdateWeddingInput } from '../schemas/wedding.schema'
import { prisma } from '../lib/prisma'



//const prisma = new PrismaClient()



// Génère un slug unique : "koffi-ama-xk39p"
const generateSlug = async (nomCeremonie: string): Promise<string> => {
  const { nanoid } = await import('nanoid')
  const base = nomCeremonie
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 20)
  const unique = nanoid(6)
  return `${base}-${unique}`
}

// Génère le QR code en base64
const generateQRCode = async (url: string): Promise<string> => {
  return await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1B3A5C', light: '#FFFFFF' },
  })
}



// Checklist par défaut créée à chaque nouveau mariage
const DEFAULT_TACHES = [
  { titre: 'Choisir et réserver le lieu de réception', priorite: 1, categorie: 'Lieu' },
  { titre: 'Définir la liste des invités', priorite: 1, categorie: 'Invités' },
  { titre: 'Choisir le traiteur', priorite: 1, categorie: 'Restauration' },
  { titre: 'Réserver le photographe', priorite: 1, categorie: 'Photo/Vidéo' },
  { titre: 'Choisir la robe et le costume', priorite: 2, categorie: 'Tenues' },
  { titre: 'Réserver le DJ ou l\'orchestre', priorite: 2, categorie: 'Animation' },
  { titre: 'Commander les faire-parts', priorite: 2, categorie: 'Communication' },
  { titre: 'Réserver le fleuriste', priorite: 2, categorie: 'Décoration' },
  { titre: 'Organiser le transport des invités', priorite: 3, categorie: 'Logistique' },
  { titre: 'Préparer le plan de table', priorite: 3, categorie: 'Invités' },
]


export const createWedding = async (req: AuthRequest, res: Response) => {
  try {
    const {
      nomCeremonie,
      dateJourJ,
      heureCeremonie,
      heureReception,
      lieuCeremonie,
      lieuReception,
      budgetTotal,
      devise,
      notes,
      partenaireId,
    } = req.body as CreateWeddingInput

    // Générer le slug unique
    const slug = await generateSlug(nomCeremonie)

    // Générer l'URL publique du RSVP et le QR code galerie
    const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3001'
    const rsvpUrl = `${baseUrl}/rsvp/${slug}`
    const galerieUrl = `${baseUrl}/gallery/${slug}`
    const qrCodeDataUrl = await generateQRCode(galerieUrl)

    // Créer le mariage + checklist dans une transaction
    const wedding = await prisma.$transaction(async (tx) => {
      // 1. Créer le mariage
      const w = await tx.wedding.create({
        data: {
          nomCeremonie,
          slug,
          dateJourJ: new Date(dateJourJ),
          heureCeremonie: heureCeremonie ?? null,
          heureReception: heureReception ?? null,
          lieuCeremonie: lieuCeremonie ?? null,
          lieuReception: lieuReception ?? null,
          budgetTotal: budgetTotal ?? 0,
          devise,
          notes: notes ?? null,
          plannerId: null,
        },
      })

      // 2. Lier le créateur comme marié(e)
      await tx.weddingCouple.create({
        data: {
          weddingId: w.id,
          userId: req.user!.id,
          role: 'MARIE',
        },
      })

      // 3. Lier le partenaire si fourni
      if (partenaireId) {
        const partenaire = await tx.user.findUnique({
          where: { id: partenaireId },
        })
        if (partenaire) {
          await tx.weddingCouple.create({
            data: {
              weddingId: w.id,
              userId: partenaireId,
              role: 'MARIEE',
            },
          })
        }
      }

      // 4. Créer la checklist par défaut
      await tx.tache.createMany({
        data: DEFAULT_TACHES.map((t) => ({
          weddingId: w.id,
          titre: t.titre,
          priorite: t.priorite,
          categorie: t.categorie,
          faite: false,
        })),
      })

      return w
    })

    return res.status(201).json({
      success: true,
      data: {
        wedding,
        slug,
        rsvpUrl,
        galerieUrl,
        qrCode: qrCodeDataUrl,
      },
    })
  } catch (error) {
    console.error('[createWedding]', error)
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du mariage',
    })
  }
}


export const getWeddings = async (req: AuthRequest, res: Response) => {
  try {
    const couples = await prisma.weddingCouple.findMany({
      where: { userId: req.user!.id },
      include: {
        wedding: {
          include: {
            couples: { include: { user: true } },
            _count: {
              select: {
                prestataires: true,
                invites: true,
                taches: true,
              },
            },
          },
        },
      },
    })

    const weddings = couples.map((c) => c.wedding)

    return res.status(200).json({
      success: true,
      data: weddings,
      meta: { total: weddings.length },
    })
  } catch (error) {
    console.error('[getWeddings]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}



export const getWedding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const wedding = await prisma.wedding.findUnique({
      where: { id },
      include: {
        couples: { include: { user: true } },
        prestataires: { include: { prestataire: true } },
        budgetItems: true,
        taches: { orderBy: { priorite: 'asc' } },
        _count: {
          select: { invites: true, photosGalerie: true, rappels: true },
        },
      },
    })

    if (!wedding) {
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    }

    // Vérifier que l'utilisateur est bien lié à ce mariage
    const isLinked = wedding.couples.some((c) => c.userId === req.user!.id)
    if (!isLinked) {
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    }

    return res.status(200).json({ success: true, data: wedding })
  } catch (error) {
    console.error('[getWedding]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const updateWedding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const data = req.body as UpdateWeddingInput

    // Vérifier accès
    const couple = await prisma.weddingCouple.findFirst({
      where: { weddingId: id, userId: req.user!.id },
    })
    if (!couple) {
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    }

    const wedding = await prisma.wedding.update({
      where: { id },
      data: {
        ...(data.nomCeremonie && { nomCeremonie: data.nomCeremonie }),
        ...(data.dateJourJ && { dateJourJ: new Date(data.dateJourJ) }),
        ...(data.heureCeremonie !== undefined && { heureCeremonie: data.heureCeremonie }),
        ...(data.heureReception !== undefined && { heureReception: data.heureReception }),
        ...(data.lieuCeremonie !== undefined && { lieuCeremonie: data.lieuCeremonie }),
        ...(data.lieuReception !== undefined && { lieuReception: data.lieuReception }),
        ...(data.budgetTotal !== undefined && { budgetTotal: data.budgetTotal }),
        ...(data.devise && { devise: data.devise }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.statut && { statut: data.statut }),
        ...(data.rsvpOuvert !== undefined && { rsvpOuvert: data.rsvpOuvert }),
        ...(data.galerieOuverte !== undefined && { galerieOuverte: data.galerieOuverte }),
        ...(data.rsvpDateLimite && { rsvpDateLimite: new Date(data.rsvpDateLimite) }),
      },
    })

    return res.status(200).json({ success: true, data: wedding })
  } catch (error) {
    console.error('[updateWedding]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const getWeddingStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const wedding = await prisma.wedding.findUnique({ where: { id } })
    if (!wedding) {
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    }

    const [budgetItems, invites, prestataires, taches] = await Promise.all([
      prisma.budgetItem.findMany({ where: { weddingId: id } }),
      prisma.invite.findMany({ where: { weddingId: id } }),
      prisma.weddingPrestataire.findMany({ where: { weddingId: id } }),
      prisma.tache.findMany({ where: { weddingId: id } }),
    ])

    const budgetConsomme = budgetItems.reduce((s, i) => s + i.montantPaye, 0)
    const budgetRestant = (wedding.budgetTotal ?? 0) - budgetConsomme
    const joursRestants = Math.ceil(
      (new Date(wedding.dateJourJ).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )

    return res.status(200).json({
      success: true,
      data: {
        joursRestants: Math.max(0, joursRestants),
        budgetTotal: wedding.budgetTotal,
        budgetConsomme,
        budgetRestant,
        invitesConfirmes: invites.filter((i) => i.statut === 'CONFIRME').length,
        invitesDeclines: invites.filter((i) => i.statut === 'DECLINE').length,
        invitesTotal: invites.length,
        prestatairesConfirmes: prestataires.filter((p) => p.statut === 'CONFIRME').length,
        prestatairesTotal: prestataires.length,
        tachesFaites: taches.filter((t) => t.faite).length,
        tachesTotal: taches.length,
      },
    })
  } catch (error) {
    console.error('[getWeddingStats]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}



export const deleteWedding = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params

    const couple = await prisma.weddingCouple.findFirst({
      where: { weddingId: id, userId: req.user!.id },
    })
    if (!couple) {
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    }

    await prisma.wedding.delete({ where: { id } })

    return res.status(200).json({ success: true, data: { message: 'Mariage supprimé' } })
  } catch (error) {
    console.error('[deleteWedding]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}