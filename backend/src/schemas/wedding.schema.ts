import { z } from 'zod'

export const createWeddingSchema = z.object({
  nomCeremonie: z
    .string({ required_error: 'Nom de la cérémonie requis' })
    .min(3, 'Nom trop court')
    .trim(),

  dateJourJ: z
    .string({ required_error: 'Date du mariage requise' })
    .datetime({ message: 'Format de date invalide (ISO 8601 requis)' }),

  heureCeremonie: z.string().optional(),
  heureReception: z.string().optional(),
  lieuCeremonie: z.string().optional(),
  lieuReception: z.string().optional(),

  budgetTotal: z
    .number()
    .min(0, 'Le budget ne peut pas être négatif')
    .optional(),

  devise: z.string().default('FCFA'),
  notes: z.string().optional(),

  partenaireId: z
    .string()
    .optional(),
})

export const updateWeddingSchema = z.object({
  nomCeremonie: z.string().min(3).trim().optional(),
  dateJourJ: z.string().datetime().optional(),
  heureCeremonie: z.string().optional(),
  heureReception: z.string().optional(),
  lieuCeremonie: z.string().optional(),
  lieuReception: z.string().optional(),
  budgetTotal: z.number().min(0).optional(),
  devise: z.string().optional(),
  notes: z.string().optional(),
  statut: z.enum(['EN_PREPARATION', 'CONFIRME', 'TERMINE', 'ANNULE']).optional(),
  rsvpOuvert: z.boolean().optional(),
  galerieOuverte: z.boolean().optional(),
  rsvpDateLimite: z.string().datetime().optional(),
})

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>
export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>