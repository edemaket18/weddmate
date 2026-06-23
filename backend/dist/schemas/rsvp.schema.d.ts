import { z } from 'zod';
export declare const rsvpSchema: z.ZodObject<{
    nom: z.ZodString;
    prenom: z.ZodString;
    statut: z.ZodEnum<["CONFIRME", "DECLINE"]>;
    telephone: z.ZodOptional<z.ZodString>;
    whatsapp: z.ZodOptional<z.ZodString>;
    nombreAccompa: z.ZodDefault<z.ZodNumber>;
    regimeAliment: z.ZodOptional<z.ZodString>;
    transport: z.ZodDefault<z.ZodBoolean>;
    hebergement: z.ZodDefault<z.ZodBoolean>;
    cote: z.ZodOptional<z.ZodEnum<["MARIE", "MARIEE"]>>;
    messageAuxMaries: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nom: string;
    prenom: string;
    statut: "CONFIRME" | "DECLINE";
    nombreAccompa: number;
    transport: boolean;
    hebergement: boolean;
    telephone?: string | undefined;
    whatsapp?: string | undefined;
    regimeAliment?: string | undefined;
    cote?: "MARIE" | "MARIEE" | undefined;
    messageAuxMaries?: string | undefined;
}, {
    nom: string;
    prenom: string;
    statut: "CONFIRME" | "DECLINE";
    telephone?: string | undefined;
    whatsapp?: string | undefined;
    nombreAccompa?: number | undefined;
    regimeAliment?: string | undefined;
    transport?: boolean | undefined;
    hebergement?: boolean | undefined;
    cote?: "MARIE" | "MARIEE" | undefined;
    messageAuxMaries?: string | undefined;
}>;
export declare const addInviteManuelSchema: z.ZodObject<{
    nom: z.ZodString;
    prenom: z.ZodString;
    telephone: z.ZodOptional<z.ZodString>;
    whatsapp: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    nombreAccompa: z.ZodDefault<z.ZodNumber>;
    regimeAliment: z.ZodOptional<z.ZodString>;
    transport: z.ZodDefault<z.ZodBoolean>;
    hebergement: z.ZodDefault<z.ZodBoolean>;
    cote: z.ZodOptional<z.ZodEnum<["MARIE", "MARIEE"]>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    nom: string;
    prenom: string;
    nombreAccompa: number;
    transport: boolean;
    hebergement: boolean;
    email?: string | undefined;
    telephone?: string | undefined;
    notes?: string | undefined;
    whatsapp?: string | undefined;
    regimeAliment?: string | undefined;
    cote?: "MARIE" | "MARIEE" | undefined;
}, {
    nom: string;
    prenom: string;
    email?: string | undefined;
    telephone?: string | undefined;
    notes?: string | undefined;
    whatsapp?: string | undefined;
    nombreAccompa?: number | undefined;
    regimeAliment?: string | undefined;
    transport?: boolean | undefined;
    hebergement?: boolean | undefined;
    cote?: "MARIE" | "MARIEE" | undefined;
}>;
export declare const updateInviteSchema: z.ZodObject<{
    statut: z.ZodOptional<z.ZodEnum<["EN_ATTENTE", "CONFIRME", "DECLINE", "LISTE_ATTENTE"]>>;
    tableAssignee: z.ZodOptional<z.ZodString>;
    nombreAccompa: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    statut?: "CONFIRME" | "EN_ATTENTE" | "DECLINE" | "LISTE_ATTENTE" | undefined;
    nombreAccompa?: number | undefined;
    tableAssignee?: string | undefined;
}, {
    notes?: string | undefined;
    statut?: "CONFIRME" | "EN_ATTENTE" | "DECLINE" | "LISTE_ATTENTE" | undefined;
    nombreAccompa?: number | undefined;
    tableAssignee?: string | undefined;
}>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
export type AddInviteManuelInput = z.infer<typeof addInviteManuelSchema>;
export type UpdateInviteInput = z.infer<typeof updateInviteSchema>;
//# sourceMappingURL=rsvp.schema.d.ts.map