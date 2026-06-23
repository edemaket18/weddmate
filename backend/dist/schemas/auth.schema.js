"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Email requis' })
        .email('Email invalide')
        .toLowerCase(),
    motDePasse: zod_1.z
        .string({ required_error: 'Mot de passe requis' })
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    nom: zod_1.z
        .string({ required_error: 'Nom requis' })
        .min(2, 'Nom trop court')
        .trim(),
    prenom: zod_1.z
        .string({ required_error: 'Prénom requis' })
        .min(2, 'Prénom trop court')
        .trim(),
    telephone: zod_1.z
        .string()
        .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide')
        .optional(),
    role: zod_1.z
        .enum(['COUPLE', 'PRESTATAIRE', 'PLANNER'])
        .default('COUPLE'),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Email requis' })
        .email('Email invalide')
        .toLowerCase(),
    motDePasse: zod_1.z
        .string({ required_error: 'Mot de passe requis' })
        .min(1, 'Mot de passe requis'),
});
exports.changePasswordSchema = zod_1.z.object({
    ancienMotDePasse: zod_1.z
        .string({ required_error: 'Ancien mot de passe requis' })
        .min(1),
    nouveauMotDePasse: zod_1.z
        .string({ required_error: 'Nouveau mot de passe requis' })
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});
//# sourceMappingURL=auth.schema.js.map