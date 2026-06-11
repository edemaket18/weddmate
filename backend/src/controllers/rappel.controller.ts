 import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import { sendWhatsAppMessage, buildMessage } from '../services/whatsapp.service'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

//const prisma = new PrismaClient()

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })

const createRappelSchema = z.object({
  destinataire: z.string({ required_error: 'Destinataire requis' }),
  dateEnvoi: z.string().datetime(),
  messagePersonna: z.string({ required_error: 'Message requis' }),
  canal: z.enum(['WHATSAPP', 'EMAIL', 'SMS']).default('WHATSAPP'),
})


export const getRappels = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    const { statut, type } = req.query

    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const rappels = await prisma.rappel.findMany({
      where: {
        weddingId,
        ...(statut && { statut: statut as any }),
        ...(type && { type: type as any }),
      },
      include: { weddingPrestataire: { include: { prestataire: true } } },
      orderBy: { dateEnvoi: 'asc' },
    })

    return res.status(200).json({ success: true, data: rappels })
  } catch (error) {
    console.error('[getRappels]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const createRappel = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const body = createRappelSchema.parse(req.body)
    const rappel = await prisma.rappel.create({
      data: {
        weddingId,
        type: 'PERSONNALISE',
        canal: body.canal,
        destinataire: body.destinataire,
        messagePersonna: body.messagePersonna,
        dateEnvoi: new Date(body.dateEnvoi),
        statut: 'PROGRAMME',
      },
    })
    return res.status(201).json({ success: true, data: rappel })
  } catch (error) {
    console.error('[createRappel]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const retryRappel = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const rappel = await prisma.rappel.findUnique({
      where: { id },
      include: { wedding: true },
    })

    if (!rappel)
      return res.status(404).json({ success: false, error: 'Rappel introuvable' })

    if (rappel.statut !== 'ECHEC')
      return res.status(400).json({ success: false, error: 'Seuls les rappels ECHEC peuvent être relancés' })

    // Vérifier accès
    if (!await checkAccess(rappel.weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    try {
      const message = buildMessage(rappel.type, {
        nomCeremonie: rappel.wedding.nomCeremonie,
        dateJourJ: rappel.wedding.dateJourJ,
        lieuCeremonie: rappel.wedding.lieuCeremonie,
        lieuReception: rappel.wedding.lieuReception,
        devise: rappel.wedding.devise,
      })

      await sendWhatsAppMessage({
        to: rappel.destinataire,
        message: rappel.messagePersonna || message,
      })

      const updated = await prisma.rappel.update({
        where: { id },
        data: { statut: 'ENVOYE', erreurMessage: null },
      })
      return res.status(200).json({ success: true, data: updated })
    } catch (sendError: any) {
      await prisma.rappel.update({
        where: { id },
        data: { erreurMessage: sendError.message?.slice(0, 255) },
      })
      return res.status(500).json({ success: false, error: 'Echec de l\'envoi WhatsApp' })
    }
  } catch (error) {
    console.error('[retryRappel]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}