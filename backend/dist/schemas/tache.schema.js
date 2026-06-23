"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTacheSchema = exports.createTacheSchema = void 0;
const zod_1 = require("zod");
exports.createTacheSchema = zod_1.z.object({
    titre: zod_1.z
        .string({ required_error: 'Titre requis' })
        .min(2, 'Titre trop court')
        .trim(),
    description: zod_1.z.string().optional(),
    echeance: zod_1.z
        .string()
        .datetime({ message: 'Format de date invalide' })
        .optional(),
    priorite: zod_1.z
        .number()
        .int()
        .min(1, 'Priorité min : 1')
        .max(3, 'Priorité max : 3')
        .default(2),
    categorie: zod_1.z.string().optional(),
});
exports.updateTacheSchema = zod_1.z.object({
    titre: zod_1.z.string().min(2).trim().optional(),
    description: zod_1.z.string().optional(),
    echeance: zod_1.z.string().datetime().optional(),
    priorite: zod_1.z.number().int().min(1).max(3).optional(),
    categorie: zod_1.z.string().optional(),
    faite: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=tache.schema.js.map