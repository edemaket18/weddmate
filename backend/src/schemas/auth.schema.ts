 import { z } from 'zod'

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email requis' })
    .email('Email invalide')
    .toLowerCase(),

  motDePasse: z
    .string({ required_error: 'Mot de passe requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),

  nom: z
    .string({ required_error: 'Nom requis' })
    .min(2, 'Nom trop court')
    .trim(),

  prenom: z
    .string({ required_error: 'Prénom requis' })
    .min(2, 'Prénom trop court')
    .trim(),

  telephone: z
    .string()
    .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide')
    .optional(),

  role: z
    .enum(['COUPLE', 'PRESTATAIRE', 'PLANNER'])
    .default('COUPLE'),
})

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email requis' })
    .email('Email invalide')
    .toLowerCase(),

  motDePasse: z
    .string({ required_error: 'Mot de passe requis' })
    .min(1, 'Mot de passe requis'),
})

export const changePasswordSchema = z.object({
  ancienMotDePasse: z
    .string({ required_error: 'Ancien mot de passe requis' })
    .min(1),

  nouveauMotDePasse: z
    .string({ required_error: 'Nouveau mot de passe requis' })
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>