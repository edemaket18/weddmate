import { Request, Response } from 'express'
import path from 'path'
import fs from 'fs'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })


export const getRsvpPage = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const wedding = await prisma.wedding.findUnique({ where: { slug } })

    // Lire le template HTML
    const htmlPath = path.join(process.cwd(), 'public', 'rsvp.html')
    let html = fs.readFileSync(htmlPath, 'utf-8')

    if (!wedding) {
      html = html.replace('__WEDDING_DATA__', JSON.stringify({
        error: 'Mariage introuvable',
        rsvpOuvert: false,
      }))
      return res.status(404).send(html)
    }

    if (!wedding.rsvpOuvert) {
      html = html.replace('__WEDDING_DATA__', JSON.stringify({
        error: 'Le formulaire RSVP est fermé',
        rsvpOuvert: false,
        nomCeremonie: wedding.nomCeremonie,
      }))
      return res.status(200).send(html)
    }

    if (wedding.rsvpDateLimite && new Date() > wedding.rsvpDateLimite) {
      html = html.replace('__WEDDING_DATA__', JSON.stringify({
        error: 'La date limite RSVP est dépassée',
        rsvpOuvert: false,
        nomCeremonie: wedding.nomCeremonie,
      }))
      return res.status(200).send(html)
    }

    // Injecter les données directement dans le HTML
    const data = {
      rsvpOuvert: true,
      nomCeremonie: wedding.nomCeremonie,
      dateJourJ: wedding.dateJourJ,
      heureCeremonie: wedding.heureCeremonie,
      heureReception: wedding.heureReception,
      lieuCeremonie: wedding.lieuCeremonie,
      lieuReception: wedding.lieuReception,
      slug: wedding.slug,
    }
    html = html.replace('__WEDDING_DATA__', JSON.stringify(data))
    return res.status(200).send(html)

  } catch (error) {
    console.error('[getRsvpPage]', error)
    return res.status(500).send('<h1>Erreur serveur</h1>')
  }
}

//Soumettre RSVP
export const submitRsvp = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const {
      nom, prenom, statut, whatsapp, telephone,
      nombreAccompa, regimeAliment, transport,
      hebergement, cote, messageAuxMaries,
    } = req.body

    if (!nom || !prenom || !statut) {
      return res.status(400).json({ success: false, error: 'Nom, prénom et statut sont requis' })
    }

    const wedding = await prisma.wedding.findUnique({ where: { slug } })
    if (!wedding) return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    if (!wedding.rsvpOuvert) return res.status(400).json({ success: false, error: 'Le formulaire RSVP est fermé' })
    if (wedding.rsvpDateLimite && new Date() > wedding.rsvpDateLimite) {
      return res.status(400).json({ success: false, error: 'Date limite dépassée' })
    }

    const invite = await prisma.invite.create({
      data: {
        weddingId: wedding.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        statut,
        telephone: telephone ?? null,
        whatsapp: whatsapp ?? null,
        nombreAccompa: nombreAccompa ?? 0,
        regimeAliment: regimeAliment ?? null,
        transport: transport ?? false,
        hebergement: hebergement ?? false,
        cote: cote ?? null,
        messageAuxMaries: messageAuxMaries ?? null,
        rsvpAt: new Date(),
        rsvpSource: 'lien',
      },
    })

    // Programmer rappel J-7
    if (statut === 'CONFIRME' && whatsapp) {
      const j7 = new Date(wedding.dateJourJ)
      j7.setDate(j7.getDate() - 7)
      if (j7 > new Date()) {
        await prisma.rappel.create({
          data: {
            weddingId: wedding.id,
            type: 'RSVP_INVITE_J7',
            canal: 'WHATSAPP',
            destinataire: whatsapp,
            dateEnvoi: j7,
            statut: 'PROGRAMME',
          },
        })
      }
    }

    // Notifier les mariés
    const couples = await prisma.weddingCouple.findMany({ where: { weddingId: wedding.id } })
    if (couples.length > 0) {
      await prisma.notification.createMany({
        data: couples.map(c => ({
          userId: c.userId,
          weddingId: wedding.id,
          titre: 'Nouvelle réponse RSVP',
          message: `${prenom} ${nom} a ${statut === 'CONFIRME' ? 'confirmé sa présence' : 'décliné l\'invitation'}`,
          lien: '/invites',
        })),
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        invite: { id: invite.id, nom: invite.nom, prenom: invite.prenom, statut: invite.statut },
        weddingDetails: {
          nomCeremonie: wedding.nomCeremonie,
          dateJourJ: wedding.dateJourJ,
          heureCeremonie: wedding.heureCeremonie,
          heureReception: wedding.heureReception,
          lieuCeremonie: wedding.lieuCeremonie,
          lieuReception: wedding.lieuReception,
        },
      },
    })
  } catch (error) {
    console.error('[submitRsvp]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

//Routes invités protégées
export const getInvites = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    const { statut, cote, transport } = req.query
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    const invites = await prisma.invite.findMany({
      where: {
        weddingId,
        ...(statut && { statut: statut as any }),
        ...(cote && { cote: cote as string }),
        ...(transport === 'true' && { transport: true }),
      },
      orderBy: { createdAt: 'desc' },
    })
    const meta = {
      total: invites.length,
      confirmes: invites.filter(i => i.statut === 'CONFIRME').length,
      declines: invites.filter(i => i.statut === 'DECLINE').length,
      enAttente: invites.filter(i => i.statut === 'EN_ATTENTE').length,
      totalPersonnes: invites.reduce((s, i) => s + 1 + i.nombreAccompa, 0),
      transport: invites.filter(i => i.transport).length,
      hebergement: invites.filter(i => i.hebergement).length,
    }
    return res.status(200).json({ success: true, data: invites, meta })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const addInviteManuel = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    const { nom, prenom, telephone, whatsapp, email, nombreAccompa, regimeAliment, transport, hebergement, cote, notes } = req.body
    const invite = await prisma.invite.create({
      data: {
        weddingId, nom: nom.trim(), prenom: prenom.trim(),
        telephone: telephone ?? null, whatsapp: whatsapp ?? null,
        email: email ?? null, nombreAccompa: nombreAccompa ?? 0,
        regimeAliment: regimeAliment ?? null, transport: transport ?? false,
        hebergement: hebergement ?? false, cote: cote ?? null,
        notes: notes ?? null, statut: 'EN_ATTENTE', rsvpSource: 'manuel',
      },
    })
    return res.status(201).json({ success: true, data: invite })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const updateInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, inviteId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Invité introuvable' })
    const { statut, tableAssignee, nombreAccompa, notes } = req.body
    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        ...(statut && { statut }),
        ...(tableAssignee !== undefined && { tableAssignee }),
        ...(nombreAccompa !== undefined && { nombreAccompa }),
        ...(notes !== undefined && { notes }),
      },
    })
    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const deleteInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, inviteId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Invité introuvable' })
    await prisma.invite.delete({ where: { id: inviteId } })
    return res.status(200).json({ success: true, data: { message: 'Invité supprimé' } })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const getRsvpStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })
    const invites = await prisma.invite.findMany({ where: { weddingId } })
    return res.status(200).json({
      success: true,
      data: {
        total: invites.length,
        confirmes: invites.filter(i => i.statut === 'CONFIRME').length,
        declines: invites.filter(i => i.statut === 'DECLINE').length,
        enAttente: invites.filter(i => i.statut === 'EN_ATTENTE').length,
        totalPersonnes: invites.reduce((s, i) => s + 1 + i.nombreAccompa, 0),
        transport: invites.filter(i => i.transport).length,
        hebergement: invites.filter(i => i.hebergement).length,
        parCote: {
          MARIE: invites.filter(i => i.cote === 'MARIE').length,
          MARIEE: invites.filter(i => i.cote === 'MARIEE').length,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const getRsvpInfo = getRsvpPage




/*
import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import path from 'path'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'

//const prisma = new PrismaClient()

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })

// C'est ce que le lien RSVP ouvre dans le téléphone de l'invité
export const getRsvpPage = async (req: Request, res: Response) => {
  const acceptsHtml = req.headers.accept?.includes('text/html')

  if (acceptsHtml) {
    // Servir la page HTML pour le navigateur
      return res.sendFile(path.join(process.cwd(), 'public', 'rsvp.html')
)  }

  // JSON fallback
  const { slug } = req.params
  const wedding = await prisma.wedding.findUnique({ where: { slug } })
  if (!wedding) return res.status(404).json({ success: false, error: 'Mariage introuvable' })
  if (!wedding.rsvpOuvert) return res.status(400).json({ success: false, error: 'Le formulaire RSVP est fermé' })

  return res.status(200).json({
    success: true,
    data: {
      nomCeremonie: wedding.nomCeremonie,
      dateJourJ: wedding.dateJourJ,
      heureCeremonie: wedding.heureCeremonie,
      heureReception: wedding.heureReception,
      lieuCeremonie: wedding.lieuCeremonie,
      lieuReception: wedding.lieuReception,
      rsvpDateLimite: wedding.rsvpDateLimite,
    },
  })
}

export const getRsvpInfo = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const wedding = await prisma.wedding.findUnique({ where: { slug } })

    if (!wedding) {
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    }
    if (!wedding.rsvpOuvert) {
      return res.status(400).json({ success: false, error: 'Le formulaire RSVP est fermé' })
    }
    if (wedding.rsvpDateLimite && new Date() > wedding.rsvpDateLimite) {
      return res.status(400).json({ success: false, error: 'La date limite RSVP est dépassée' })
    }

    return res.status(200).json({
      success: true,
      data: {
        nomCeremonie: wedding.nomCeremonie,
        dateJourJ: wedding.dateJourJ,
        heureCeremonie: wedding.heureCeremonie,
        heureReception: wedding.heureReception,
        lieuCeremonie: wedding.lieuCeremonie,
        lieuReception: wedding.lieuReception,
        rsvpDateLimite: wedding.rsvpDateLimite,
      },
    })
  } catch (error) {
    console.error('[getRsvpInfo]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const submitRsvp = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const {
      nom, prenom, statut, whatsapp, telephone,
      nombreAccompa, regimeAliment, transport,
      hebergement, cote, messageAuxMaries,
    } = req.body

    if (!nom || !prenom || !statut) {
      return res.status(400).json({ success: false, error: 'Nom, prénom et statut sont requis' })
    }

    const wedding = await prisma.wedding.findUnique({ where: { slug } })
    if (!wedding) return res.status(404).json({ success: false, error: 'Mariage introuvable' })
    if (!wedding.rsvpOuvert) return res.status(400).json({ success: false, error: 'Le formulaire RSVP est fermé' })
    if (wedding.rsvpDateLimite && new Date() > wedding.rsvpDateLimite) {
      return res.status(400).json({ success: false, error: 'Date limite dépassée' })
    }

    // Créer l'invité
    const invite = await prisma.invite.create({
      data: {
        weddingId: wedding.id,
        nom: nom.trim(),
        prenom: prenom.trim(),
        statut,
        telephone: telephone ?? null,
        whatsapp: whatsapp ?? null,
        nombreAccompa: nombreAccompa ?? 0,
        regimeAliment: regimeAliment ?? null,
        transport: transport ?? false,
        hebergement: hebergement ?? false,
        cote: cote ?? null,
        messageAuxMaries: messageAuxMaries ?? null,
        rsvpAt: new Date(),
        rsvpSource: 'lien',
      },
    })

    // Programmer rappel J-7 si confirmé et whatsapp fourni
    if (statut === 'CONFIRME' && whatsapp) {
      const dateJourJ = new Date(wedding.dateJourJ)
      const j7 = new Date(dateJourJ)
      j7.setDate(j7.getDate() - 7)
      if (j7 > new Date()) {
        await prisma.rappel.create({
          data: {
            weddingId: wedding.id,
            type: 'RSVP_INVITE_J7',
            canal: 'WHATSAPP',
            destinataire: whatsapp,
            dateEnvoi: j7,
            statut: 'PROGRAMME',
          },
        })
      }
    }

    // Notifier les mariés
    const couples = await prisma.weddingCouple.findMany({ where: { weddingId: wedding.id } })
    if (couples.length > 0) {
      await prisma.notification.createMany({
        data: couples.map(c => ({
          userId: c.userId,
          weddingId: wedding.id,
          titre: 'Nouvelle réponse RSVP',
          message: `${prenom} ${nom} a ${statut === 'CONFIRME' ? 'confirmé sa présence' : 'décliné l\'invitation'}`,
          lien: '/invites',
        })),
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        invite: { id: invite.id, nom: invite.nom, prenom: invite.prenom, statut: invite.statut },
        weddingDetails: {
          nomCeremonie: wedding.nomCeremonie,
          dateJourJ: wedding.dateJourJ,
          heureCeremonie: wedding.heureCeremonie,
          heureReception: wedding.heureReception,
          lieuCeremonie: wedding.lieuCeremonie,
          lieuReception: wedding.lieuReception,
        },
      },
    })
  } catch (error) {
    console.error('[submitRsvp]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const getInvites = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    const { statut, cote, transport } = req.query

    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const invites = await prisma.invite.findMany({
      where: {
        weddingId,
        ...(statut && { statut: statut as any }),
        ...(cote && { cote: cote as string }),
        ...(transport === 'true' && { transport: true }),
      },
      orderBy: { createdAt: 'desc' },
    })

    const meta = {
      total: invites.length,
      confirmes: invites.filter(i => i.statut === 'CONFIRME').length,
      declines: invites.filter(i => i.statut === 'DECLINE').length,
      enAttente: invites.filter(i => i.statut === 'EN_ATTENTE').length,
      totalPersonnes: invites.reduce((s, i) => s + 1 + i.nombreAccompa, 0),
      transport: invites.filter(i => i.transport).length,
      hebergement: invites.filter(i => i.hebergement).length,
    }

    return res.status(200).json({ success: true, data: invites, meta })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const addInviteManuel = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const { nom, prenom, telephone, whatsapp, email, nombreAccompa, regimeAliment, transport, hebergement, cote, notes } = req.body

    const invite = await prisma.invite.create({
      data: {
        weddingId, nom: nom.trim(), prenom: prenom.trim(),
        telephone: telephone ?? null, whatsapp: whatsapp ?? null,
        email: email ?? null, nombreAccompa: nombreAccompa ?? 0,
        regimeAliment: regimeAliment ?? null, transport: transport ?? false,
        hebergement: hebergement ?? false, cote: cote ?? null,
        notes: notes ?? null, statut: 'EN_ATTENTE', rsvpSource: 'manuel',
      },
    })
    return res.status(201).json({ success: true, data: invite })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const updateInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, inviteId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Invité introuvable' })

    const { statut, tableAssignee, nombreAccompa, notes } = req.body
    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        ...(statut && { statut }),
        ...(tableAssignee !== undefined && { tableAssignee }),
        ...(nombreAccompa !== undefined && { nombreAccompa }),
        ...(notes !== undefined && { notes }),
      },
    })
    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const deleteInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, inviteId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Invité introuvable' })

    await prisma.invite.delete({ where: { id: inviteId } })
    return res.status(200).json({ success: true, data: { message: 'Invité supprimé' } })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const getRsvpStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const invites = await prisma.invite.findMany({ where: { weddingId } })
    return res.status(200).json({
      success: true,
      data: {
        total: invites.length,
        confirmes: invites.filter(i => i.statut === 'CONFIRME').length,
        declines: invites.filter(i => i.statut === 'DECLINE').length,
        enAttente: invites.filter(i => i.statut === 'EN_ATTENTE').length,
        totalPersonnes: invites.reduce((s, i) => s + 1 + i.nombreAccompa, 0),
        transport: invites.filter(i => i.transport).length,
        hebergement: invites.filter(i => i.hebergement).length,
        parCote: {
          MARIE: invites.filter(i => i.cote === 'MARIE').length,
          MARIEE: invites.filter(i => i.cote === 'MARIEE').length,
        },
      },
    })
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


*/























/*import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import { RsvpInput, AddInviteManuelInput, UpdateInviteInput } from '../schemas/rsvp.schema'

const prisma = new PrismaClient()

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })


export const getRsvpForm = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const wedding = await prisma.wedding.findUnique({ where: { slug } })

    if (!wedding)
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })

    if (!wedding.rsvpOuvert)
      return res.status(400).json({ success: false, error: 'Le formulaire RSVP est fermé' })

    if (wedding.rsvpDateLimite && new Date() > wedding.rsvpDateLimite)
      return res.status(400).json({ success: false, error: 'La date limite RSVP est dépassée' })

    return res.status(200).json({
      success: true,
      data: {
        nomCeremonie: wedding.nomCeremonie,
        dateJourJ: wedding.dateJourJ,
        heureCeremonie: wedding.heureCeremonie,
        heureReception: wedding.heureReception,
        lieuCeremonie: wedding.lieuCeremonie,
        lieuReception: wedding.lieuReception,
        rsvpDateLimite: wedding.rsvpDateLimite,
      },
    })
  } catch (error) {
    console.error('[getRsvpForm]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const submitRsvp = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params
    const body = req.body as RsvpInput

    const wedding = await prisma.wedding.findUnique({ where: { slug } })
    if (!wedding)
      return res.status(404).json({ success: false, error: 'Mariage introuvable' })

    if (!wedding.rsvpOuvert)
      return res.status(400).json({ success: false, error: 'Le formulaire RSVP est fermé' })

    if (wedding.rsvpDateLimite && new Date() > wedding.rsvpDateLimite)
      return res.status(400).json({ success: false, error: 'Date limite dépassée' })

    // Créer l'invité
    const invite = await prisma.invite.create({
      data: {
        weddingId: wedding.id,
        nom: body.nom,
        prenom: body.prenom,
        statut: body.statut,
        telephone: body.telephone ?? null,
        whatsapp: body.whatsapp ?? null,
        nombreAccompa: body.nombreAccompa ?? 0,
        regimeAliment: body.regimeAliment ?? null,
        transport: body.transport ?? false,
        hebergement: body.hebergement ?? false,
        cote: body.cote ?? null,
        messageAuxMaries: body.messageAuxMaries ?? null,
        rsvpAt: new Date(),
        rsvpSource: 'lien',
      },
    })

    // Programmer rappel J-7 si confirmé et whatsapp fourni
    if (body.statut === 'CONFIRME' && body.whatsapp) {
      const dateJourJ = new Date(wedding.dateJourJ)
      const j7 = new Date(dateJourJ)
      j7.setDate(j7.getDate() - 7)

      if (j7 > new Date()) {
        await prisma.rappel.create({
          data: {
            weddingId: wedding.id,
            type: 'RSVP_INVITE_J7',
            canal: 'WHATSAPP',
            destinataire: body.whatsapp,
            dateEnvoi: j7,
            statut: 'PROGRAMME',
          },
        })
      }
    }

    // Notifier les mariés
    const couples = await prisma.weddingCouple.findMany({
      where: { weddingId: wedding.id },
    })
    if (couples.length > 0) {
      await prisma.notification.createMany({
        data: couples.map((c) => ({
          userId: c.userId,
          weddingId: wedding.id,
          titre: 'Nouvelle réponse RSVP',
          message: `${body.prenom} ${body.nom} a ${body.statut === 'CONFIRME' ? 'confirmé sa présence' : 'décliné l\'invitation'}`,
          lien: `/invites`,
        })),
      })
    }

    return res.status(201).json({
      success: true,
      data: {
        invite: {
          id: invite.id,
          nom: invite.nom,
          prenom: invite.prenom,
          statut: invite.statut,
        },
        weddingDetails: {
          nomCeremonie: wedding.nomCeremonie,
          dateJourJ: wedding.dateJourJ,
          heureCeremonie: wedding.heureCeremonie,
          heureReception: wedding.heureReception,
          lieuCeremonie: wedding.lieuCeremonie,
          lieuReception: wedding.lieuReception,
        },
      },
    })
  } catch (error) {
    console.error('[submitRsvp]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const getInvites = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    const { statut, cote, transport } = req.query

    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const invites = await prisma.invite.findMany({
      where: {
        weddingId,
        ...(statut && { statut: statut as any }),
        ...(cote && { cote: cote as string }),
        ...(transport === 'true' && { transport: true }),
      },
      orderBy: { createdAt: 'desc' },
    })

    const meta = {
      total: invites.length,
      confirmes: invites.filter(i => i.statut === 'CONFIRME').length,
      declines: invites.filter(i => i.statut === 'DECLINE').length,
      enAttente: invites.filter(i => i.statut === 'EN_ATTENTE').length,
      totalPersonnes: invites.reduce((s, i) => s + 1 + i.nombreAccompa, 0),
      transport: invites.filter(i => i.transport).length,
      hebergement: invites.filter(i => i.hebergement).length,
    }

    return res.status(200).json({ success: true, data: invites, meta })
  } catch (error) {
    console.error('[getInvites]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const addInviteManuel = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const body = req.body as AddInviteManuelInput
    const invite = await prisma.invite.create({
      data: {
        weddingId,
        nom: body.nom,
        prenom: body.prenom,
        telephone: body.telephone ?? null,
        whatsapp: body.whatsapp ?? null,
        email: body.email ?? null,
        nombreAccompa: body.nombreAccompa ?? 0,
        regimeAliment: body.regimeAliment ?? null,
        transport: body.transport ?? false,
        hebergement: body.hebergement ?? false,
        cote: body.cote ?? null,
        notes: body.notes ?? null,
        statut: 'EN_ATTENTE',
        rsvpSource: 'manuel',
      },
    })
    return res.status(201).json({ success: true, data: invite })
  } catch (error) {
    console.error('[addInviteManuel]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const updateInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, inviteId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const body = req.body as UpdateInviteInput
    const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Invité introuvable' })

    const updated = await prisma.invite.update({
      where: { id: inviteId },
      data: {
        ...(body.statut && { statut: body.statut }),
        ...(body.tableAssignee !== undefined && { tableAssignee: body.tableAssignee }),
        ...(body.nombreAccompa !== undefined && { nombreAccompa: body.nombreAccompa }),
        ...(body.notes !== undefined && { notes: body.notes }),
      },
    })
    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('[updateInvite]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const deleteInvite = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, inviteId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const invite = await prisma.invite.findUnique({ where: { id: inviteId } })
    if (!invite || invite.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Invité introuvable' })

    await prisma.invite.delete({ where: { id: inviteId } })
    return res.status(200).json({ success: true, data: { message: 'Invité supprimé' } })
  } catch (error) {
    console.error('[deleteInvite]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const getRsvpStats = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const invites = await prisma.invite.findMany({ where: { weddingId } })

    return res.status(200).json({
      success: true,
      data: {
        total: invites.length,
        confirmes: invites.filter(i => i.statut === 'CONFIRME').length,
        declines: invites.filter(i => i.statut === 'DECLINE').length,
        enAttente: invites.filter(i => i.statut === 'EN_ATTENTE').length,
        totalPersonnes: invites.reduce((s, i) => s + 1 + i.nombreAccompa, 0),
        transport: invites.filter(i => i.transport).length,
        hebergement: invites.filter(i => i.hebergement).length,
        parCote: {
          MARIE: invites.filter(i => i.cote === 'MARIE').length,
          MARIEE: invites.filter(i => i.cote === 'MARIEE').length,
        },
      },
    })
  } catch (error) {
    console.error('[getRsvpStats]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}
  */