"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteWedding = exports.getWeddingStats = exports.updateWedding = exports.getWedding = exports.getWeddings = exports.createWedding = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient()
// Génère un slug unique : "koffi-ama-xk39p"
const generateSlug = async (nomCeremonie) => {
    const { nanoid } = await Promise.resolve().then(() => __importStar(require('nanoid')));
    const base = nomCeremonie
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 20);
    const unique = nanoid(6);
    return `${base}-${unique}`;
};
// Génère le QR code en base64
const generateQRCode = async (url) => {
    return await qrcode_1.default.toDataURL(url, {
        width: 300,
        margin: 2,
        color: { dark: '#1B3A5C', light: '#FFFFFF' },
    });
};
const resolvePublicBaseUrl = () => {
    const baseUrl = process.env.APP_BASE_URL;
    if (baseUrl)
        return baseUrl.replace(/\/$/, '');
    if (process.env.NODE_ENV !== 'production')
        return 'http://localhost:3001';
    throw new Error('Variable d\'environnement manquante: APP_BASE_URL');
};
// Checklist par défaut créée à chaque nouveau mariage
const DEFAULT_TACHES = [
    { titre: 'Choisir et réserver le lieu de réception', priorite: 1, categorie: 'Lieu' },
    { titre: 'Définir la liste des invités', priorite: 1, categorie: 'Invités' },
    { titre: 'Choisir le traiteur', priorite: 1, categorie: 'Restauration' },
    { titre: 'Réserver le photographe', priorite: 1, categorie: 'Photo/Vidéo' },
    { titre: 'Choisir la robe et le costume', priorite: 2, categorie: 'Tenues' },
    { titre: 'Réserver le DJ ou l\'orchestre', priorite: 2, categorie: 'Animation' },
    { titre: 'Commander les faire-parts', priorite: 2, categorie: 'Communication' },
    { titre: 'Réserver le fleuriste', priorite: 2, categorie: 'Décoration' },
    { titre: 'Organiser le transport des invités', priorite: 3, categorie: 'Logistique' },
    { titre: 'Préparer le plan de table', priorite: 3, categorie: 'Invités' },
];
const createWedding = async (req, res) => {
    try {
        const { nomCeremonie, dateJourJ, heureCeremonie, heureReception, lieuCeremonie, lieuReception, budgetTotal, devise, notes, partenaireId, } = req.body;
        // Générer le slug unique
        const slug = await generateSlug(nomCeremonie);
        // Générer l'URL publique du RSVP et le QR code galerie
        const baseUrl = resolvePublicBaseUrl();
        const rsvpUrl = `${baseUrl}/rsvp/${slug}`;
        const galerieUrl = `${baseUrl}/gallery/${slug}`;
        const qrCodeDataUrl = await generateQRCode(galerieUrl);
        // Créer le mariage + checklist dans une transaction
        const wedding = await prisma_1.prisma.$transaction(async (tx) => {
            // 1. Créer le mariage
            const w = await tx.wedding.create({
                data: {
                    nomCeremonie,
                    slug,
                    dateJourJ: new Date(dateJourJ),
                    heureCeremonie: heureCeremonie ?? null,
                    heureReception: heureReception ?? null,
                    lieuCeremonie: lieuCeremonie ?? null,
                    lieuReception: lieuReception ?? null,
                    budgetTotal: budgetTotal ?? 0,
                    devise,
                    notes: notes ?? null,
                    plannerId: null,
                },
            });
            // 2. Lier le créateur comme marié(e)
            await tx.weddingCouple.create({
                data: {
                    weddingId: w.id,
                    userId: req.user.id,
                    role: 'MARIE',
                },
            });
            // 3. Lier le partenaire si fourni
            if (partenaireId) {
                const partenaire = await tx.user.findUnique({
                    where: { id: partenaireId },
                });
                if (partenaire) {
                    await tx.weddingCouple.create({
                        data: {
                            weddingId: w.id,
                            userId: partenaireId,
                            role: 'MARIEE',
                        },
                    });
                }
            }
            // 4. Créer la checklist par défaut
            await tx.tache.createMany({
                data: DEFAULT_TACHES.map((t) => ({
                    weddingId: w.id,
                    titre: t.titre,
                    priorite: t.priorite,
                    categorie: t.categorie,
                    faite: false,
                })),
            });
            return w;
        });
        return res.status(201).json({
            success: true,
            data: {
                wedding,
                slug,
                rsvpUrl,
                galerieUrl,
                qrCode: qrCodeDataUrl,
            },
        });
    }
    catch (error) {
        console.error('[createWedding]', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du mariage',
        });
    }
};
exports.createWedding = createWedding;
const getWeddings = async (req, res) => {
    try {
        const couples = await prisma_1.prisma.weddingCouple.findMany({
            where: { userId: req.user.id },
            include: {
                wedding: {
                    include: {
                        couples: { include: { user: true } },
                        _count: {
                            select: {
                                prestataires: true,
                                invites: true,
                                taches: true,
                            },
                        },
                    },
                },
            },
        });
        const weddings = couples.map((c) => c.wedding);
        return res.status(200).json({
            success: true,
            data: weddings,
            meta: { total: weddings.length },
        });
    }
    catch (error) {
        console.error('[getWeddings]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.getWeddings = getWeddings;
const getWedding = async (req, res) => {
    try {
        const { id } = req.params;
        const wedding = await prisma_1.prisma.wedding.findUnique({
            where: { id },
            include: {
                couples: { include: { user: true } },
                prestataires: { include: { prestataire: true } },
                budgetItems: true,
                taches: { orderBy: { priorite: 'asc' } },
                _count: {
                    select: { invites: true, photosGalerie: true, rappels: true },
                },
            },
        });
        if (!wedding) {
            return res.status(404).json({ success: false, error: 'Mariage introuvable' });
        }
        // Vérifier que l'utilisateur est bien lié à ce mariage
        const isLinked = wedding.couples.some((c) => c.userId === req.user.id);
        if (!isLinked) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        return res.status(200).json({ success: true, data: wedding });
    }
    catch (error) {
        console.error('[getWedding]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.getWedding = getWedding;
const updateWedding = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        // Vérifier accès
        const couple = await prisma_1.prisma.weddingCouple.findFirst({
            where: { weddingId: id, userId: req.user.id },
        });
        if (!couple) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        const wedding = await prisma_1.prisma.wedding.update({
            where: { id },
            data: {
                ...(data.nomCeremonie && { nomCeremonie: data.nomCeremonie }),
                ...(data.dateJourJ && { dateJourJ: new Date(data.dateJourJ) }),
                ...(data.heureCeremonie !== undefined && { heureCeremonie: data.heureCeremonie }),
                ...(data.heureReception !== undefined && { heureReception: data.heureReception }),
                ...(data.lieuCeremonie !== undefined && { lieuCeremonie: data.lieuCeremonie }),
                ...(data.lieuReception !== undefined && { lieuReception: data.lieuReception }),
                ...(data.budgetTotal !== undefined && { budgetTotal: data.budgetTotal }),
                ...(data.devise && { devise: data.devise }),
                ...(data.notes !== undefined && { notes: data.notes }),
                ...(data.statut && { statut: data.statut }),
                ...(data.rsvpOuvert !== undefined && { rsvpOuvert: data.rsvpOuvert }),
                ...(data.galerieOuverte !== undefined && { galerieOuverte: data.galerieOuverte }),
                ...(data.rsvpDateLimite && { rsvpDateLimite: new Date(data.rsvpDateLimite) }),
            },
        });
        return res.status(200).json({ success: true, data: wedding });
    }
    catch (error) {
        console.error('[updateWedding]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.updateWedding = updateWedding;
const getWeddingStats = async (req, res) => {
    try {
        const { id } = req.params;
        const couple = await prisma_1.prisma.weddingCouple.findFirst({
            where: { weddingId: id, userId: req.user.id },
        });
        if (!couple) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        const wedding = await prisma_1.prisma.wedding.findUnique({ where: { id } });
        if (!wedding) {
            return res.status(404).json({ success: false, error: 'Mariage introuvable' });
        }
        const [budgetItems, invites, prestataires, taches] = await Promise.all([
            prisma_1.prisma.budgetItem.findMany({ where: { weddingId: id } }),
            prisma_1.prisma.invite.findMany({ where: { weddingId: id } }),
            prisma_1.prisma.weddingPrestataire.findMany({ where: { weddingId: id } }),
            prisma_1.prisma.tache.findMany({ where: { weddingId: id } }),
        ]);
        const budgetConsomme = budgetItems.reduce((s, i) => s + i.montantPaye, 0);
        const budgetRestant = (wedding.budgetTotal ?? 0) - budgetConsomme;
        const joursRestants = Math.ceil((new Date(wedding.dateJourJ).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return res.status(200).json({
            success: true,
            data: {
                joursRestants: Math.max(0, joursRestants),
                budgetTotal: wedding.budgetTotal,
                budgetConsomme,
                budgetRestant,
                invitesConfirmes: invites.filter((i) => i.statut === 'CONFIRME').length,
                invitesDeclines: invites.filter((i) => i.statut === 'DECLINE').length,
                invitesTotal: invites.length,
                prestatairesConfirmes: prestataires.filter((p) => p.statut === 'CONFIRME').length,
                prestatairesTotal: prestataires.length,
                tachesFaites: taches.filter((t) => t.faite).length,
                tachesTotal: taches.length,
            },
        });
    }
    catch (error) {
        console.error('[getWeddingStats]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.getWeddingStats = getWeddingStats;
const deleteWedding = async (req, res) => {
    try {
        const { id } = req.params;
        const couple = await prisma_1.prisma.weddingCouple.findFirst({
            where: { weddingId: id, userId: req.user.id },
        });
        if (!couple) {
            return res.status(403).json({ success: false, error: 'Accès refusé' });
        }
        await prisma_1.prisma.wedding.delete({ where: { id } });
        return res.status(200).json({ success: true, data: { message: 'Mariage supprimé' } });
    }
    catch (error) {
        console.error('[deleteWedding]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.deleteWedding = deleteWedding;
//# sourceMappingURL=wedding.controller.js.map