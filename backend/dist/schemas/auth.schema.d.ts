import { z } from 'zod';
export declare const registerSchema: z.ZodObject<{
    email: z.ZodString;
    motDePasse: z.ZodString;
    nom: z.ZodString;
    prenom: z.ZodString;
    telephone: z.ZodOptional<z.ZodString>;
    role: z.ZodDefault<z.ZodEnum<["COUPLE", "PRESTATAIRE", "PLANNER"]>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    motDePasse: string;
    nom: string;
    prenom: string;
    role: "COUPLE" | "PRESTATAIRE" | "PLANNER";
    telephone?: string | undefined;
}, {
    email: string;
    motDePasse: string;
    nom: string;
    prenom: string;
    telephone?: string | undefined;
    role?: "COUPLE" | "PRESTATAIRE" | "PLANNER" | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    motDePasse: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    motDePasse: string;
}, {
    email: string;
    motDePasse: string;
}>;
export declare const changePasswordSchema: z.ZodObject<{
    ancienMotDePasse: z.ZodString;
    nouveauMotDePasse: z.ZodString;
}, "strip", z.ZodTypeAny, {
    ancienMotDePasse: string;
    nouveauMotDePasse: string;
}, {
    ancienMotDePasse: string;
    nouveauMotDePasse: string;
}>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
//# sourceMappingURL=auth.schema.d.ts.map