 import { Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import { CreateBudgetItemInput, UpdateBudgetItemInput } from '../schemas/budget.schema'
import { prisma } from '../lib/prisma'

//const prisma = new PrismaClient()

const checkAccess = async (weddingId: string, userId: string) =>
  prisma.weddingCouple.findFirst({ where: { weddingId, userId } })


export const createBudgetItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const body = req.body as CreateBudgetItemInput
    const item = await prisma.budgetItem.create({
      data: {
        weddingId,
        libelle: body.libelle,
        categorie: body.categorie,
        montantPrevu: body.montantPrevu,
        montantPaye: body.montantPaye ?? 0,
        statut: body.statut ?? 'PREVU',
        datePaiement: body.datePaiement ? new Date(body.datePaiement) : null,
        notes: body.notes ?? null,
      },
    })
    return res.status(201).json({ success: true, data: item })
  } catch (error) {
    console.error('[createBudgetItem]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const getBudget = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } })
    const items = await prisma.budgetItem.findMany({
      where: { weddingId },
      orderBy: { createdAt: 'asc' },
    })

    const totalPrevu = items.reduce((s, i) => s + i.montantPrevu, 0)
    const totalPaye = items.reduce((s, i) => s + i.montantPaye, 0)
    const totalRestant = totalPrevu - totalPaye

    // Synthèse par catégorie
    const parCategorie: Record<string, { prevu: number; paye: number }> = {}
    for (const item of items) {
      if (!parCategorie[item.categorie]) {
        parCategorie[item.categorie] = { prevu: 0, paye: 0 }
      }
      parCategorie[item.categorie].prevu += item.montantPrevu
      parCategorie[item.categorie].paye += item.montantPaye
    }

    return res.status(200).json({
      success: true,
      data: {
        items,
        synthese: {
          budgetTotal: wedding?.budgetTotal ?? 0,
          totalPrevu,
          totalPaye,
          totalRestant,
          depassement: totalPrevu > (wedding?.budgetTotal ?? 0),
          tauxConsommation: totalPrevu > 0 ? Math.round((totalPaye / totalPrevu) * 100) : 0,
          parCategorie,
        },
      },
    })
  } catch (error) {
    console.error('[getBudget]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const updateBudgetItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, itemId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const body = req.body as UpdateBudgetItemInput
    const item = await prisma.budgetItem.findUnique({ where: { id: itemId } })
    if (!item || item.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Item introuvable' })

    // Déterminer statut automatiquement si montantPaye est mis à jour
    let statut = body.statut ?? item.statut
    if (body.montantPaye !== undefined) {
      const prevu = body.montantPrevu ?? item.montantPrevu
      if (body.montantPaye === 0) statut = 'PREVU'
      else if (body.montantPaye >= prevu) statut = 'SOLDE'
      else statut = 'ACOMPTE'
    }

    const updated = await prisma.budgetItem.update({
      where: { id: itemId },
      data: {
        ...(body.libelle && { libelle: body.libelle }),
        ...(body.categorie && { categorie: body.categorie }),
        ...(body.montantPrevu !== undefined && { montantPrevu: body.montantPrevu }),
        ...(body.montantPaye !== undefined && { montantPaye: body.montantPaye }),
        ...(body.datePaiement && { datePaiement: new Date(body.datePaiement) }),
        ...(body.notes !== undefined && { notes: body.notes }),
        statut,
      },
    })
    return res.status(200).json({ success: true, data: updated })
  } catch (error) {
    console.error('[updateBudgetItem]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}

export const deleteBudgetItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id: weddingId, itemId } = req.params
    if (!await checkAccess(weddingId, req.user!.id))
      return res.status(403).json({ success: false, error: 'Accès refusé' })

    const item = await prisma.budgetItem.findUnique({ where: { id: itemId } })
    if (!item || item.weddingId !== weddingId)
      return res.status(404).json({ success: false, error: 'Item introuvable' })

    await prisma.budgetItem.delete({ where: { id: itemId } })
    return res.status(200).json({ success: true, data: { message: 'Item supprimé' } })
  } catch (error) {
    console.error('[deleteBudgetItem]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}