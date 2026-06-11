import { z } from 'zod'

export const rsvpSchema = z.object({
  nom: z.string({ required_error: 'Nom requis' }).min(2).trim(),
  prenom: z.string({ required_error: 'Prénom requis' }).min(2).trim(),
  statut: z.enum(['CONFIRME', 'DECLINE'], { required_error: 'Statut requis' }),
  telephone: z.string().optional(),
  whatsapp: z.string().optional(),
  nombreAccompa: z.number().int().min(0).default(0),
  regimeAliment: z.string().optional(),
  transport: z.boolean().default(false),
  hebergement: z.boolean().default(false),
  cote: z.enum(['MARIE', 'MARIEE']).optional(),
  messageAuxMaries: z.string().max(500).optional(),
})

export const addInviteManuelSchema = z.object({
  nom: z.string({ required_error: 'Nom requis' }).min(2).trim(),
  prenom: z.string({ required_error: 'Prénom requis' }).min(2).trim(),
  telephone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  nombreAccompa: z.number().int().min(0).default(0),
  regimeAliment: z.string().optional(),
  transport: z.boolean().default(false),
  hebergement: z.boolean().default(false),
  cote: z.enum(['MARIE', 'MARIEE']).optional(),
  notes: z.string().optional(),
})

export const updateInviteSchema = z.object({
  statut: z.enum(['EN_ATTENTE', 'CONFIRME', 'DECLINE', 'LISTE_ATTENTE']).optional(),
  tableAssignee: z.string().optional(),
  nombreAccompa: z.number().int().min(0).optional(),
  notes: z.string().optional(),
})

export type RsvpInput = z.infer<typeof rsvpSchema>
export type AddInviteManuelInput = z.infer<typeof addInviteManuelSchema>
export type UpdateInviteInput = z.infer<typeof updateInviteSchema>
