import { z } from 'zod';
export declare const createBudgetItemSchema: z.ZodObject<{
    libelle: z.ZodString;
    categorie: z.ZodEnum<["LIEU", "TRAITEUR", "PHOTOGRAPHE", "VIDEASTE", "DJ_MUSIQUE", "ORCHESTRE", "FLEURISTE", "DECORATION", "OFFICIANT", "COIFFURE_MAQUILLAGE", "TRANSPORT", "GATEAU", "ANIMATION", "AUTRE"]>;
    montantPrevu: z.ZodNumber;
    montantPaye: z.ZodDefault<z.ZodNumber>;
    statut: z.ZodDefault<z.ZodEnum<["PREVU", "ACOMPTE", "SOLDE"]>>;
    datePaiement: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    statut: "PREVU" | "ACOMPTE" | "SOLDE";
    categorie: "LIEU" | "TRAITEUR" | "PHOTOGRAPHE" | "VIDEASTE" | "DJ_MUSIQUE" | "ORCHESTRE" | "FLEURISTE" | "DECORATION" | "OFFICIANT" | "COIFFURE_MAQUILLAGE" | "TRANSPORT" | "GATEAU" | "ANIMATION" | "AUTRE";
    libelle: string;
    montantPrevu: number;
    montantPaye: number;
    notes?: string | undefined;
    datePaiement?: string | undefined;
}, {
    categorie: "LIEU" | "TRAITEUR" | "PHOTOGRAPHE" | "VIDEASTE" | "DJ_MUSIQUE" | "ORCHESTRE" | "FLEURISTE" | "DECORATION" | "OFFICIANT" | "COIFFURE_MAQUILLAGE" | "TRANSPORT" | "GATEAU" | "ANIMATION" | "AUTRE";
    libelle: string;
    montantPrevu: number;
    notes?: string | undefined;
    statut?: "PREVU" | "ACOMPTE" | "SOLDE" | undefined;
    montantPaye?: number | undefined;
    datePaiement?: string | undefined;
}>;
export declare const updateBudgetItemSchema: z.ZodObject<{
    libelle: z.ZodOptional<z.ZodString>;
    categorie: z.ZodOptional<z.ZodEnum<["LIEU", "TRAITEUR", "PHOTOGRAPHE", "VIDEASTE", "DJ_MUSIQUE", "ORCHESTRE", "FLEURISTE", "DECORATION", "OFFICIANT", "COIFFURE_MAQUILLAGE", "TRANSPORT", "GATEAU", "ANIMATION", "AUTRE"]>>;
    montantPrevu: z.ZodOptional<z.ZodNumber>;
    montantPaye: z.ZodOptional<z.ZodNumber>;
    statut: z.ZodOptional<z.ZodEnum<["PREVU", "ACOMPTE", "SOLDE"]>>;
    datePaiement: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    notes?: string | undefined;
    statut?: "PREVU" | "ACOMPTE" | "SOLDE" | undefined;
    categorie?: "LIEU" | "TRAITEUR" | "PHOTOGRAPHE" | "VIDEASTE" | "DJ_MUSIQUE" | "ORCHESTRE" | "FLEURISTE" | "DECORATION" | "OFFICIANT" | "COIFFURE_MAQUILLAGE" | "TRANSPORT" | "GATEAU" | "ANIMATION" | "AUTRE" | undefined;
    libelle?: string | undefined;
    montantPrevu?: number | undefined;
    montantPaye?: number | undefined;
    datePaiement?: string | undefined;
}, {
    notes?: string | undefined;
    statut?: "PREVU" | "ACOMPTE" | "SOLDE" | undefined;
    categorie?: "LIEU" | "TRAITEUR" | "PHOTOGRAPHE" | "VIDEASTE" | "DJ_MUSIQUE" | "ORCHESTRE" | "FLEURISTE" | "DECORATION" | "OFFICIANT" | "COIFFURE_MAQUILLAGE" | "TRANSPORT" | "GATEAU" | "ANIMATION" | "AUTRE" | undefined;
    libelle?: string | undefined;
    montantPrevu?: number | undefined;
    montantPaye?: number | undefined;
    datePaiement?: string | undefined;
}>;
export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;
export type UpdateBudgetItemInput = z.infer<typeof updateBudgetItemSchema>;
//# sourceMappingURL=budget.schema.d.ts.map