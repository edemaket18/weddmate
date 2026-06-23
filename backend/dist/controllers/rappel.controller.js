"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retryRappel = exports.createRappel = exports.getRappels = void 0;
const whatsapp_service_1 = require("../services/whatsapp.service");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient()
const checkAccess = async (weddingId, userId) => prisma_1.prisma.weddingCouple.findFirst({ where: { weddingId, userId } });
const createRappelSchema = zod_1.z.object({
    destinataire: zod_1.z.string({ required_error: 'Destinataire requis' }),
    dateEnvoi: zod_1.z.string().datetime(),
    messagePersonna: zod_1.z.string({ required_error: 'Message requis' }),
    canal: zod_1.z.enum(['WHATSAPP', 'EMAIL', 'SMS']).default('WHATSAPP'),
});
const getRappels = async (req, res) => {
    try {
        const { id: weddingId } = req.params;
        const { statut, type } = req.query;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const rappels = await prisma_1.prisma.rappel.findMany({
            where: {
                weddingId,
                ...(statut && { statut: statut }),
                ...(type && { type: type }),
            },
            include: { weddingPrestataire: { include: { prestataire: true } } },
            orderBy: { dateEnvoi: 'asc' },
        });
        return res.status(200).json({ success: true, data: rappels });
    }
    catch (error) {
        console.error('[getRappels]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.getRappels = getRappels;
const createRappel = async (req, res) => {
    try {
        const { id: weddingId } = req.params;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const body = createRappelSchema.parse(req.body);
        const rappel = await prisma_1.prisma.rappel.create({
            data: {
                weddingId,
                type: 'PERSONNALISE',
                canal: body.canal,
                destinataire: body.destinataire,
                messagePersonna: body.messagePersonna,
                dateEnvoi: new Date(body.dateEnvoi),
                statut: 'PROGRAMME',
            },
        });
        return res.status(201).json({ success: true, data: rappel });
    }
    catch (error) {
        console.error('[createRappel]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.createRappel = createRappel;
const retryRappel = async (req, res) => {
    try {
        const { rappelId } = req.params;
        const rappel = await prisma_1.prisma.rappel.findUnique({
            where: { id: rappelId },
            include: { wedding: true },
        });
        if (!rappel)
            return res.status(404).json({ success: false, error: 'Rappel introuvable' });
        if (rappel.statut !== 'ECHEC')
            return res.status(400).json({ success: false, error: 'Seuls les rappels ECHEC peuvent être relancés' });
        // Vérifier accès
        if (!await checkAccess(rappel.weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        try {
            const message = (0, whatsapp_service_1.buildMessage)(rappel.type, {
                nomCeremonie: rappel.wedding.nomCeremonie,
                dateJourJ: rappel.wedding.dateJourJ,
                lieuCeremonie: rappel.wedding.lieuCeremonie,
                lieuReception: rappel.wedding.lieuReception,
                devise: rappel.wedding.devise,
            });
            await (0, whatsapp_service_1.sendWhatsAppMessage)({
                to: rappel.destinataire,
                message: rappel.messagePersonna || message,
            });
            const updated = await prisma_1.prisma.rappel.update({
                where: { id: rappelId },
                data: { statut: 'ENVOYE', erreurMessage: null },
            });
            return res.status(200).json({ success: true, data: updated });
        }
        catch (sendError) {
            await prisma_1.prisma.rappel.update({
                where: { id: rappelId },
                data: { erreurMessage: sendError.message?.slice(0, 255) },
            });
            return res.status(500).json({ success: false, error: 'Echec de l\'envoi WhatsApp' });
        }
    }
    catch (error) {
        console.error('[retryRappel]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.retryRappel = retryRappel;
//# sourceMappingURL=rappel.controller.js.map