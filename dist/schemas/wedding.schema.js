"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateWeddingSchema = exports.createWeddingSchema = void 0;
const zod_1 = require("zod");
exports.createWeddingSchema = zod_1.z.object({
    nomCeremonie: zod_1.z
        .string({ required_error: 'Nom de la cérémonie requis' })
        .min(3, 'Nom trop court')
        .trim(),
    dateJourJ: zod_1.z
        .string({ required_error: 'Date du mariage requise' })
        .datetime({ message: 'Format de date invalide (ISO 8601 requis)' }),
    heureCeremonie: zod_1.z.string().optional(),
    heureReception: zod_1.z.string().optional(),
    lieuCeremonie: zod_1.z.string().optional(),
    lieuReception: zod_1.z.string().optional(),
    budgetTotal: zod_1.z
        .number()
        .min(0, 'Le budget ne peut pas être négatif')
        .optional()
        .nullable(),
    devise: zod_1.z.string().default('FCFA'),
    notes: zod_1.z.string().optional(),
    partenaireId: zod_1.z
        .string()
        .optional(),
});
exports.updateWeddingSchema = zod_1.z.object({
    nomCeremonie: zod_1.z.string().min(3).trim().optional(),
    dateJourJ: zod_1.z.string().datetime().optional(),
    heureCeremonie: zod_1.z.string().optional(),
    heureReception: zod_1.z.string().optional(),
    lieuCeremonie: zod_1.z.string().optional(),
    lieuReception: zod_1.z.string().optional(),
    budgetTotal: zod_1.z.number().min(0).optional(),
    devise: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    statut: zod_1.z.enum(['EN_PREPARATION', 'CONFIRME', 'TERMINE', 'ANNULE']).optional(),
    rsvpOuvert: zod_1.z.boolean().optional(),
    galerieOuverte: zod_1.z.boolean().optional(),
    rsvpDateLimite: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=wedding.schema.js.map