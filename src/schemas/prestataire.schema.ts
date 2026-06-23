 import { z } from 'zod'

const PrestaireCategorie = z.enum([
  'LIEU', 'TRAITEUR', 'PHOTOGRAPHE', 'VIDEASTE',
  'DJ_MUSIQUE', 'ORCHESTRE', 'FLEURISTE', 'DECORATION',
  'OFFICIANT', 'COIFFURE_MAQUILLAGE', 'TRANSPORT', 'GATEAU',
  'ANIMATION', 'AUTRE'
])

const PrestaireStatut = z.enum([
  'CONTACTE', 'EN_ATTENTE', 'CONFIRME', 'PAYE', 'ANNULE'
])

export const addPrestataireSchema = z.object({
  nomEntreprise: z
    .string({ required_error: 'Nom de l\'entreprise requis' })
    .min(2, 'Nom trop court')
    .trim(),

  nomContact: z
    .string({ required_error: 'Nom du contact requis' })
    .min(2, 'Nom trop court')
    .trim(),

  telephone: z
    .string({ required_error: 'Téléphone requis' })
    .min(8, 'Numéro invalide'),

  categorie: PrestaireCategorie,

  email: z.string().email('Email invalide').optional(),
  whatsapp: z.string().min(8).optional(),
  description: z.string().optional(),
  siteWeb: z.string().url('URL invalide').optional(),
  ville: z.string().optional(),

  montantDevis: z.number().min(0).optional(),
  montantAcompte: z.number().min(0).optional(),
  dateAcompte: z.string().datetime().optional(),
  heureArrivee: z.string().datetime().optional(),
  heureDepart: z.string().datetime().optional(),
  lieuIntervention: z.string().optional(),
  notesContrat: z.string().optional(),
})

export const updatePrestataireSchema = z.object({
  nomEntreprise: z.string().min(2).trim().optional(),
  nomContact: z.string().min(2).trim().optional(),
  telephone: z.string().min(8).optional(),
  email: z.string().email().optional(),
  whatsapp: z.string().optional(),
  categorie: PrestaireCategorie.optional(),
  description: z.string().optional(),
  ville: z.string().optional(),
  statut: PrestaireStatut.optional(),
  montantDevis: z.number().min(0).optional(),
  montantAcompte: z.number().min(0).optional(),
  dateAcompte: z.string().datetime().optional(),
  montantSolde: z.number().min(0).optional(),
  dateSolde: z.string().datetime().optional(),
  heureArrivee: z.string().datetime().optional(),
  heureDepart: z.string().datetime().optional(),
  lieuIntervention: z.string().optional(),
  notesContrat: z.string().optional(),
  ficheConfirmee: z.boolean().optional(),
})

export const evaluationSchema = z.object({
  note: z.number().int().min(1).max(5, 'La note doit être entre 1 et 5'),
  commentaire: z.string().optional(),
})

export type AddPrestataireInput = z.infer<typeof addPrestataireSchema>
export type UpdatePrestataireInput = z.infer<typeof updatePrestataireSchema>
export type EvaluationInput = z.infer<typeof evaluationSchema>