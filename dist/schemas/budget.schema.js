"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBudgetItemSchema = exports.createBudgetItemSchema = void 0;
const zod_1 = require("zod");
const PrestaireCategorie = zod_1.z.enum([
    'LIEU', 'TRAITEUR', 'PHOTOGRAPHE', 'VIDEASTE',
    'DJ_MUSIQUE', 'ORCHESTRE', 'FLEURISTE', 'DECORATION',
    'OFFICIANT', 'COIFFURE_MAQUILLAGE', 'TRANSPORT', 'GATEAU',
    'ANIMATION', 'AUTRE'
]);
exports.createBudgetItemSchema = zod_1.z.object({
    libelle: zod_1.z.string({ required_error: 'Libellé requis' }).min(2).trim(),
    categorie: PrestaireCategorie,
    montantPrevu: zod_1.z.number({ required_error: 'Montant prévu requis' }).min(0),
    montantPaye: zod_1.z.number().min(0).default(0),
    statut: zod_1.z.enum(['PREVU', 'ACOMPTE', 'SOLDE']).default('PREVU'),
    datePaiement: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateBudgetItemSchema = zod_1.z.object({
    libelle: zod_1.z.string().min(2).trim().optional(),
    categorie: PrestaireCategorie.optional(),
    montantPrevu: zod_1.z.number().min(0).optional(),
    montantPaye: zod_1.z.number().min(0).optional(),
    statut: zod_1.z.enum(['PREVU', 'ACOMPTE', 'SOLDE']).optional(),
    datePaiement: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=budget.schema.js.map