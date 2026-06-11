import { z } from 'zod'

const PrestaireCategorie = z.enum([
  'LIEU', 'TRAITEUR', 'PHOTOGRAPHE', 'VIDEASTE',
  'DJ_MUSIQUE', 'ORCHESTRE', 'FLEURISTE', 'DECORATION',
  'OFFICIANT', 'COIFFURE_MAQUILLAGE', 'TRANSPORT', 'GATEAU',
  'ANIMATION', 'AUTRE'
])

export const createBudgetItemSchema = z.object({
  libelle: z.string({ required_error: 'Libellé requis' }).min(2).trim(),
  categorie: PrestaireCategorie,
  montantPrevu: z.number({ required_error: 'Montant prévu requis' }).min(0),
  montantPaye: z.number().min(0).default(0),
  statut: z.enum(['PREVU', 'ACOMPTE', 'SOLDE']).default('PREVU'),
  datePaiement: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export const updateBudgetItemSchema = z.object({
  libelle: z.string().min(2).trim().optional(),
  categorie: PrestaireCategorie.optional(),
  montantPrevu: z.number().min(0).optional(),
  montantPaye: z.number().min(0).optional(),
  statut: z.enum(['PREVU', 'ACOMPTE', 'SOLDE']).optional(),
  datePaiement: z.string().datetime().optional(),
  notes: z.string().optional(),
})

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>