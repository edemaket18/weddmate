"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluerPrestataire = exports.removePrestataire = exports.updatePrestataire = exports.getPrestataire = exports.getPrestataires = exports.addPrestataire = void 0;
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient()
// Vérifie que l'user est lié au mariage
const checkAccess = async (weddingId, userId) => {
    return prisma_1.prisma.weddingCouple.findFirst({
        where: { weddingId, userId },
    });
};
const addPrestataire = async (req, res) => {
    try {
        const { id: weddingId } = req.params;
        const body = req.body;
        if (!await checkAccess(weddingId, req.user.id)) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        // Créer ou réutiliser le prestataire dans la table globale
        let prestataire = await prisma_1.prisma.prestataire.findFirst({
            where: {
                telephone: body.telephone,
                nomEntreprise: body.nomEntreprise,
            },
        });
        if (!prestataire) {
            prestataire = await prisma_1.prisma.prestataire.create({
                data: {
                    nomEntreprise: body.nomEntreprise,
                    nomContact: body.nomContact,
                    telephone: body.telephone,
                    email: body.email ?? null,
                    whatsapp: body.whatsapp ?? null,
                    categorie: body.categorie,
                    description: body.description ?? null,
                    siteWeb: body.siteWeb ?? null,
                    ville: body.ville ?? null,
                },
            });
        }
        // Vérifier qu'il n'est pas déjà lié à ce mariage
        const existing = await prisma_1.prisma.weddingPrestataire.findUnique({
            where: {
                weddingId_prestataireId: {
                    weddingId,
                    prestataireId: prestataire.id,
                },
            },
        });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Ce prestataire est déjà lié à ce mariage',
            });
        }
        // Créer la liaison wedding <-> prestataire
        const weddingPrestataire = await prisma_1.prisma.weddingPrestataire.create({
            data: {
                weddingId,
                prestataireId: prestataire.id,
                statut: 'CONTACTE',
                montantDevis: body.montantDevis ?? null,
                montantAcompte: body.montantAcompte ?? null,
                dateAcompte: body.dateAcompte ? new Date(body.dateAcompte) : null,
                heureArrivee: body.heureArrivee ? new Date(body.heureArrivee) : null,
                heureDepart: body.heureDepart ? new Date(body.heureDepart) : null,
                lieuIntervention: body.lieuIntervention ?? null,
                notesContrat: body.notesContrat ?? null,
            },
            include: { prestataire: true },
        });
        // Programmer rappels automatiques
        const wedding = await prisma_1.prisma.wedding.findUnique({ where: { id: weddingId } });
        if (wedding) {
            const rappels = [];
            const dateJourJ = new Date(wedding.dateJourJ);
            // J-30
            const j30 = new Date(dateJourJ);
            j30.setDate(j30.getDate() - 30);
            if (j30 > new Date()) {
                rappels.push({
                    weddingId,
                    weddingPrestataireId: weddingPrestataire.id,
                    type: 'JOUR_J_MOINS_30',
                    canal: 'WHATSAPP',
                    destinataire: prestataire.whatsapp || prestataire.telephone,
                    dateEnvoi: j30,
                    statut: 'PROGRAMME',
                });
            }
            // J-7
            const j7 = new Date(dateJourJ);
            j7.setDate(j7.getDate() - 7);
            if (j7 > new Date()) {
                rappels.push({
                    weddingId,
                    weddingPrestataireId: weddingPrestataire.id,
                    type: 'JOUR_J_MOINS_7',
                    canal: 'WHATSAPP',
                    destinataire: prestataire.whatsapp || prestataire.telephone,
                    dateEnvoi: j7,
                    statut: 'PROGRAMME',
                });
            }
            // J-1
            const j1 = new Date(dateJourJ);
            j1.setDate(j1.getDate() - 1);
            if (j1 > new Date()) {
                rappels.push({
                    weddingId,
                    weddingPrestataireId: weddingPrestataire.id,
                    type: 'JOUR_J_MOINS_1',
                    canal: 'WHATSAPP',
                    destinataire: prestataire.whatsapp || prestataire.telephone,
                    dateEnvoi: j1,
                    statut: 'PROGRAMME',
                });
            }
            if (rappels.length > 0) {
                await prisma_1.prisma.rappel.createMany({ data: rappels });
            }
        }
        return res.status(201).json({
            success: true,
            data: weddingPrestataire,
        });
    }
    catch (error) {
        console.error('[addPrestataire]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.addPrestataire = addPrestataire;
const getPrestataires = async (req, res) => {
    try {
        const { id: weddingId } = req.params;
        const { statut, categorie } = req.query;
        if (!await checkAccess(weddingId, req.user.id)) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        const prestataires = await prisma_1.prisma.weddingPrestataire.findMany({
            where: {
                weddingId,
                ...(statut && { statut: statut }),
                ...(categorie && {
                    prestataire: { categorie: categorie },
                }),
            },
            include: { prestataire: true },
            orderBy: { createdAt: 'asc' },
        });
        // Résumé par statut
        const stats = {
            total: prestataires.length,
            confirmes: prestataires.filter(p => p.statut === 'CONFIRME').length,
            enAttente: prestataires.filter(p => p.statut === 'EN_ATTENTE').length,
            payes: prestataires.filter(p => p.statut === 'PAYE').length,
            montantTotal: prestataires.reduce((s, p) => s + (p.montantDevis ?? 0), 0),
            montantPaye: prestataires.reduce((s, p) => s + (p.montantAcompte ?? 0) + (p.montantSolde ?? 0), 0),
        };
        return res.status(200).json({
            success: true,
            data: prestataires,
            meta: stats,
        });
    }
    catch (error) {
        console.error('[getPrestataires]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.getPrestataires = getPrestataires;
const getPrestataire = async (req, res) => {
    try {
        const { id: weddingId, prestId } = req.params;
        if (!await checkAccess(weddingId, req.user.id)) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        const wp = await prisma_1.prisma.weddingPrestataire.findUnique({
            where: { id: prestId },
            include: {
                prestataire: { include: { evaluations: true } },
                rappels: { orderBy: { dateEnvoi: 'asc' } },
            },
        });
        if (!wp || wp.weddingId !== weddingId) {
            return res.status(404).json({ success: false, error: 'Prestataire introuvable' });
        }
        return res.status(200).json({ success: true, data: wp });
    }
    catch (error) {
        console.error('[getPrestataire]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.getPrestataire = getPrestataire;
const updatePrestataire = async (req, res) => {
    try {
        const { id: weddingId, prestId } = req.params;
        const body = req.body;
        if (!await checkAccess(weddingId, req.user.id)) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        const wp = await prisma_1.prisma.weddingPrestataire.findUnique({
            where: { id: prestId },
        });
        if (!wp || wp.weddingId !== weddingId) {
            return res.status(404).json({ success: false, error: 'Prestataire introuvable' });
        }
        // Mettre à jour la fiche prestataire globale si besoin
        if (body.nomEntreprise || body.nomContact || body.telephone ||
            body.email || body.whatsapp || body.categorie ||
            body.description || body.ville) {
            await prisma_1.prisma.prestataire.update({
                where: { id: wp.prestataireId },
                data: {
                    ...(body.nomEntreprise && { nomEntreprise: body.nomEntreprise }),
                    ...(body.nomContact && { nomContact: body.nomContact }),
                    ...(body.telephone && { telephone: body.telephone }),
                    ...(body.email !== undefined && { email: body.email }),
                    ...(body.whatsapp !== undefined && { whatsapp: body.whatsapp }),
                    ...(body.categorie && { categorie: body.categorie }),
                    ...(body.description !== undefined && { description: body.description }),
                    ...(body.ville !== undefined && { ville: body.ville }),
                },
            });
        }
        // Mettre à jour la liaison
        const updated = await prisma_1.prisma.weddingPrestataire.update({
            where: { id: prestId },
            data: {
                ...(body.statut && { statut: body.statut }),
                ...(body.montantDevis !== undefined && { montantDevis: body.montantDevis }),
                ...(body.montantAcompte !== undefined && { montantAcompte: body.montantAcompte }),
                ...(body.dateAcompte && { dateAcompte: new Date(body.dateAcompte) }),
                ...(body.montantSolde !== undefined && { montantSolde: body.montantSolde }),
                ...(body.dateSolde && { dateSolde: new Date(body.dateSolde) }),
                ...(body.heureArrivee && { heureArrivee: new Date(body.heureArrivee) }),
                ...(body.heureDepart && { heureDepart: new Date(body.heureDepart) }),
                ...(body.lieuIntervention !== undefined && { lieuIntervention: body.lieuIntervention }),
                ...(body.notesContrat !== undefined && { notesContrat: body.notesContrat }),
                ...(body.ficheConfirmee !== undefined && { ficheConfirmee: body.ficheConfirmee }),
            },
            include: { prestataire: true },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        console.error('[updatePrestataire]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.updatePrestataire = updatePrestataire;
const removePrestataire = async (req, res) => {
    try {
        const { id: weddingId, prestId } = req.params;
        if (!await checkAccess(weddingId, req.user.id)) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        const wp = await prisma_1.prisma.weddingPrestataire.findUnique({ where: { id: prestId } });
        if (!wp || wp.weddingId !== weddingId) {
            return res.status(404).json({ success: false, error: 'Prestataire introuvable' });
        }
        // Supprimer les rappels liés + la liaison
        await prisma_1.prisma.rappel.deleteMany({ where: { weddingPrestataireId: prestId } });
        await prisma_1.prisma.weddingPrestataire.delete({ where: { id: prestId } });
        return res.status(200).json({ success: true, data: { message: 'Prestataire retiré du mariage' } });
    }
    catch (error) {
        console.error('[removePrestataire]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.removePrestataire = removePrestataire;
const evaluerPrestataire = async (req, res) => {
    try {
        const { id: weddingId, prestId } = req.params;
        const { note, commentaire } = req.body;
        if (!await checkAccess(weddingId, req.user.id)) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        const wp = await prisma_1.prisma.weddingPrestataire.findUnique({ where: { id: prestId } });
        if (!wp || wp.weddingId !== weddingId) {
            return res.status(404).json({ success: false, error: 'Prestataire introuvable' });
        }
        // Créer ou mettre à jour l'évaluation
        const evaluation = await prisma_1.prisma.evaluation.upsert({
            where: {
                prestataireId_weddingId: {
                    prestataireId: wp.prestataireId,
                    weddingId,
                },
            },
            create: {
                prestataireId: wp.prestataireId,
                weddingId,
                note,
                commentaire: commentaire ?? null,
            },
            update: { note, commentaire: commentaire ?? null },
        });
        // Recalculer la note globale du prestataire
        const allEvals = await prisma_1.prisma.evaluation.findMany({
            where: { prestataireId: wp.prestataireId },
        });
        const moyenne = allEvals.reduce((s, e) => s + e.note, 0) / allEvals.length;
        await prisma_1.prisma.prestataire.update({
            where: { id: wp.prestataireId },
            data: { noteGlobale: Math.round(moyenne * 10) / 10 },
        });
        return res.status(201).json({ success: true, data: evaluation });
    }
    catch (error) {
        console.error('[evaluerPrestataire]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.evaluerPrestataire = evaluerPrestataire;
//# sourceMappingURL=prestataire.controller.js.map