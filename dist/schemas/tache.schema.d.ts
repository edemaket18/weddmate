import { z } from 'zod';
export declare const createTacheSchema: z.ZodObject<{
    titre: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    echeance: z.ZodOptional<z.ZodString>;
    priorite: z.ZodDefault<z.ZodNumber>;
    categorie: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    priorite: number;
    titre: string;
    categorie?: string | undefined;
    description?: string | undefined;
    echeance?: string | undefined;
}, {
    titre: string;
    priorite?: number | undefined;
    categorie?: string | undefined;
    description?: string | undefined;
    echeance?: string | undefined;
}>;
export declare const updateTacheSchema: z.ZodObject<{
    titre: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    echeance: z.ZodOptional<z.ZodString>;
    priorite: z.ZodOptional<z.ZodNumber>;
    categorie: z.ZodOptional<z.ZodString>;
    faite: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    priorite?: number | undefined;
    categorie?: string | undefined;
    titre?: string | undefined;
    description?: string | undefined;
    echeance?: string | undefined;
    faite?: boolean | undefined;
}, {
    priorite?: number | undefined;
    categorie?: string | undefined;
    titre?: string | undefined;
    description?: string | undefined;
    echeance?: string | undefined;
    faite?: boolean | undefined;
}>;
export type CreateTacheInput = z.infer<typeof createTacheSchema>;
export type UpdateTacheInput = z.infer<typeof updateTacheSchema>;
//# sourceMappingURL=tache.schema.d.ts.map