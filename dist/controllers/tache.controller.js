"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTaches = exports.deleteTache = exports.toggleTache = exports.updateTache = exports.createTache = exports.getTaches = void 0;
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient()
const checkAccess = async (weddingId, userId) => prisma_1.prisma.weddingCouple.findFirst({ where: { weddingId, userId } });
const getTaches = async (req, res) => {
    try {
        const { id: weddingId } = req.params;
        const { faite, priorite, categorie } = req.query;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const taches = await prisma_1.prisma.tache.findMany({
            where: {
                weddingId,
                ...(faite !== undefined && { faite: faite === 'true' }),
                ...(priorite && { priorite: parseInt(priorite) }),
                ...(categorie && { categorie: categorie }),
            },
            orderBy: [{ priorite: 'asc' }, { echeance: 'asc' }],
        });
        const now = new Date();
        const meta = {
            total: taches.length,
            faites: taches.filter(t => t.faite).length,
            enRetard: taches.filter(t => !t.faite && t.echeance && new Date(t.echeance) < now).length,
            progression: taches.length > 0
                ? Math.round((taches.filter(t => t.faite).length / taches.length) * 100)
                : 0,
        };
        return res.status(200).json({ success: true, data: taches, meta });
    }
    catch (error) {
        console.error('[getTaches]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.getTaches = getTaches;
const createTache = async (req, res) => {
    try {
        const { id: weddingId } = req.params;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const body = req.body;
        const tache = await prisma_1.prisma.tache.create({
            data: {
                weddingId,
                titre: body.titre,
                description: body.description ?? null,
                echeance: body.echeance ? new Date(body.echeance) : null,
                priorite: body.priorite ?? 2,
                categorie: body.categorie ?? null,
                faite: false,
            },
        });
        return res.status(201).json({ success: true, data: tache });
    }
    catch (error) {
        console.error('[createTache]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.createTache = createTache;
const updateTache = async (req, res) => {
    try {
        const { id: weddingId, tacheId } = req.params;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const tache = await prisma_1.prisma.tache.findUnique({ where: { id: tacheId } });
        if (!tache || tache.weddingId !== weddingId)
            return res.status(404).json({ success: false, error: 'Tâche introuvable' });
        const body = req.body;
        const updated = await prisma_1.prisma.tache.update({
            where: { id: tacheId },
            data: {
                ...(body.titre && { titre: body.titre }),
                ...(body.description !== undefined && { description: body.description }),
                ...(body.echeance !== undefined && {
                    echeance: body.echeance ? new Date(body.echeance) : null,
                }),
                ...(body.priorite !== undefined && { priorite: body.priorite }),
                ...(body.categorie !== undefined && { categorie: body.categorie }),
                ...(body.faite !== undefined && { faite: body.faite }),
            },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        console.error('[updateTache]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.updateTache = updateTache;
const toggleTache = async (req, res) => {
    try {
        const { id: weddingId, tacheId } = req.params;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const tache = await prisma_1.prisma.tache.findUnique({ where: { id: tacheId } });
        if (!tache || tache.weddingId !== weddingId)
            return res.status(404).json({ success: false, error: 'Tâche introuvable' });
        const updated = await prisma_1.prisma.tache.update({
            where: { id: tacheId },
            data: { faite: !tache.faite },
        });
        return res.status(200).json({ success: true, data: updated });
    }
    catch (error) {
        console.error('[toggleTache]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.toggleTache = toggleTache;
const deleteTache = async (req, res) => {
    try {
        const { id: weddingId, tacheId } = req.params;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const tache = await prisma_1.prisma.tache.findUnique({ where: { id: tacheId } });
        if (!tache || tache.weddingId !== weddingId)
            return res.status(404).json({ success: false, error: 'Tâche introuvable' });
        await prisma_1.prisma.tache.delete({ where: { id: tacheId } });
        return res.status(200).json({ success: true, data: { message: 'Tâche supprimée' } });
    }
    catch (error) {
        console.error('[deleteTache]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.deleteTache = deleteTache;
const clearTaches = async (req, res) => {
    try {
        const { id: weddingId } = req.params;
        const { faiteOnly } = req.query;
        if (!await checkAccess(weddingId, req.user.id))
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        const where = faiteOnly === 'true'
            ? { weddingId, faite: true }
            : { weddingId };
        const { count } = await prisma_1.prisma.tache.deleteMany({ where });
        return res.status(200).json({
            success: true,
            data: { message: `${count} tâche(s) supprimée(s)` },
        });
    }
    catch (error) {
        console.error('[clearTaches]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.clearTaches = clearTaches;
//# sourceMappingURL=tache.controller.js.map