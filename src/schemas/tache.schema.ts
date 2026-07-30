import { z } from 'zod'

export const createTacheSchema = z.object({
  titre: z
    .string({ required_error: 'Titre requis' })
    .min(2, 'Titre trop court')
    .trim(),

  description: z.string().optional(),

  echeance: z
    .string()
    .datetime({ message: 'Format de date invalide' })
    .optional(),

  priorite: z
    .number()
    .int()
    .min(1, 'Priorité min : 1')
    .max(3, 'Priorité max : 3')
    .default(2),

  categorie: z.string().optional(),
})

export const updateTacheSchema = z.object({
  titre: z.string().min(2).trim().optional(),
  description: z.string().optional(),
  echeance: z.string().datetime().optional(),
  priorite: z.number().int().min(1).max(3).optional(),
  categorie: z.string().optional(),
  faite: z.boolean().optional(),
})

export type CreateTacheInput = z.infer<typeof createTacheSchema>
export type UpdateTacheInput = z.infer<typeof updateTacheSchema>