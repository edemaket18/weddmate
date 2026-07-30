interface SendMessageParams {
    to: string;
    message: string;
}
export declare const sendWhatsAppMessage: ({ to, message }: SendMessageParams) => Promise<any>;
export declare const buildMessage: (type: string, data: {
    nomCeremonie: string;
    dateJourJ: Date;
    lieuCeremonie?: string | null;
    lieuReception?: string | null;
    nomPrestataire?: string;
    montant?: number;
    devise?: string;
}) => string;
export {};
//# sourceMappingURL=whatsapp.service.d.ts.map