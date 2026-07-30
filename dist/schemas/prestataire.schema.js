"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluationSchema = exports.updatePrestataireSchema = exports.addPrestataireSchema = void 0;
const zod_1 = require("zod");
const PrestaireCategorie = zod_1.z.enum([
    'LIEU', 'TRAITEUR', 'PHOTOGRAPHE', 'VIDEASTE',
    'DJ_MUSIQUE', 'ORCHESTRE', 'FLEURISTE', 'DECORATION',
    'OFFICIANT', 'COIFFURE_MAQUILLAGE', 'TRANSPORT', 'GATEAU',
    'ANIMATION', 'AUTRE'
]);
const PrestaireStatut = zod_1.z.enum([
    'CONTACTE', 'EN_ATTENTE', 'CONFIRME', 'PAYE', 'ANNULE'
]);
exports.addPrestataireSchema = zod_1.z.object({
    nomEntreprise: zod_1.z
        .string({ required_error: 'Nom de l\'entreprise requis' })
        .min(2, 'Nom trop court')
        .trim(),
    nomContact: zod_1.z
        .string({ required_error: 'Nom du contact requis' })
        .min(2, 'Nom trop court')
        .trim(),
    telephone: zod_1.z
        .string({ required_error: 'Téléphone requis' })
        .min(8, 'Numéro invalide'),
    categorie: PrestaireCategorie,
    email: zod_1.z.string().email('Email invalide').optional(),
    whatsapp: zod_1.z.string().min(8).optional(),
    description: zod_1.z.string().optional(),
    siteWeb: zod_1.z.string().url('URL invalide').optional(),
    ville: zod_1.z.string().optional(),
    montantDevis: zod_1.z.number().min(0).optional(),
    montantAcompte: zod_1.z.number().min(0).optional(),
    dateAcompte: zod_1.z.string().datetime().optional(),
    heureArrivee: zod_1.z.string().datetime().optional(),
    heureDepart: zod_1.z.string().datetime().optional(),
    lieuIntervention: zod_1.z.string().optional(),
    notesContrat: zod_1.z.string().optional(),
});
exports.updatePrestataireSchema = zod_1.z.object({
    nomEntreprise: zod_1.z.string().min(2).trim().optional(),
    nomContact: zod_1.z.string().min(2).trim().optional(),
    telephone: zod_1.z.string().min(8).optional(),
    email: zod_1.z.string().email().optional(),
    whatsapp: zod_1.z.string().optional(),
    categorie: PrestaireCategorie.optional(),
    description: zod_1.z.string().optional(),
    ville: zod_1.z.string().optional(),
    statut: PrestaireStatut.optional(),
    montantDevis: zod_1.z.number().min(0).optional(),
    montantAcompte: zod_1.z.number().min(0).optional(),
    dateAcompte: zod_1.z.string().datetime().optional(),
    montantSolde: zod_1.z.number().min(0).optional(),
    dateSolde: zod_1.z.string().datetime().optional(),
    heureArrivee: zod_1.z.string().datetime().optional(),
    heureDepart: zod_1.z.string().datetime().optional(),
    lieuIntervention: zod_1.z.string().optional(),
    notesContrat: zod_1.z.string().optional(),
    ficheConfirmee: zod_1.z.boolean().optional(),
});
exports.evaluationSchema = zod_1.z.object({
    note: zod_1.z.number().int().min(1).max(5, 'La note doit être entre 1 et 5'),
    commentaire: zod_1.z.string().optional(),
});
//# sourceMappingURL=prestataire.schema.js.map