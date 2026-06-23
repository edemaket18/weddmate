"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInviteSchema = exports.addInviteManuelSchema = exports.rsvpSchema = void 0;
const zod_1 = require("zod");
exports.rsvpSchema = zod_1.z.object({
    nom: zod_1.z.string({ required_error: 'Nom requis' }).min(2).trim(),
    prenom: zod_1.z.string({ required_error: 'Prénom requis' }).min(2).trim(),
    statut: zod_1.z.enum(['CONFIRME', 'DECLINE'], { required_error: 'Statut requis' }),
    telephone: zod_1.z.string().optional(),
    whatsapp: zod_1.z.string().optional(),
    nombreAccompa: zod_1.z.number().int().min(0).default(0),
    regimeAliment: zod_1.z.string().optional(),
    transport: zod_1.z.boolean().default(false),
    hebergement: zod_1.z.boolean().default(false),
    cote: zod_1.z.enum(['MARIE', 'MARIEE']).optional(),
    messageAuxMaries: zod_1.z.string().max(500).optional(),
});
exports.addInviteManuelSchema = zod_1.z.object({
    nom: zod_1.z.string({ required_error: 'Nom requis' }).min(2).trim(),
    prenom: zod_1.z.string({ required_error: 'Prénom requis' }).min(2).trim(),
    telephone: zod_1.z.string().optional(),
    whatsapp: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    nombreAccompa: zod_1.z.number().int().min(0).default(0),
    regimeAliment: zod_1.z.string().optional(),
    transport: zod_1.z.boolean().default(false),
    hebergement: zod_1.z.boolean().default(false),
    cote: zod_1.z.enum(['MARIE', 'MARIEE']).optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateInviteSchema = zod_1.z.object({
    statut: zod_1.z.enum(['EN_ATTENTE', 'CONFIRME', 'DECLINE', 'LISTE_ATTENTE']).optional(),
    tableAssignee: zod_1.z.string().optional(),
    nombreAccompa: zod_1.z.number().int().min(0).optional(),
    notes: zod_1.z.string().optional(),
});
//# sourceMappingURL=rsvp.schema.js.map