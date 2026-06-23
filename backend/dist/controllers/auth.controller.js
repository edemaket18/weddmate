"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.changePassword = exports.updateProfile = exports.me = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
//const prisma = new PrismaClient()
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Variable d\'environnement manquante: JWT_SECRET');
    }
    return secret;
};
const signToken = (payload) => {
    return jsonwebtoken_1.default.sign(payload, getJwtSecret(), {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};
const safeUser = (user) => ({
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    telephone: user.telephone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
});
const register = async (req, res) => {
    try {
        const { email, motDePasse, nom, prenom, telephone, role } = req.body;
        const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Cet email est déjà utilisé',
            });
        }
        if (telephone) {
            const existingPhone = await prisma_1.prisma.user.findUnique({
                where: { telephone },
            });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    error: 'Ce numéro de téléphone est déjà utilisé',
                });
            }
        }
        const hashedPassword = await bcryptjs_1.default.hash(motDePasse, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                motDePasse: hashedPassword,
                nom,
                prenom,
                telephone: telephone ?? null,
                role,
            },
        });
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        await prisma_1.prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return res.status(201).json({
            success: true,
            data: { user: safeUser(user), token },
        });
    }
    catch (error) {
        console.error('[register]', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la création du compte',
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, motDePasse } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect',
            });
        }
        const isValid = await bcryptjs_1.default.compare(motDePasse, user.motDePasse);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Email ou mot de passe incorrect',
            });
        }
        const token = signToken({ id: user.id, email: user.email, role: user.role });
        await prisma_1.prisma.session.create({
            data: {
                userId: user.id,
                token,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return res.status(200).json({
            success: true,
            data: { user: safeUser(user), token },
        });
    }
    catch (error) {
        console.error('[login]', error);
        return res.status(500).json({
            success: false,
            error: 'Erreur lors de la connexion',
        });
    }
};
exports.login = login;
const me = async (req, res) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.id },
        });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        }
        return res.status(200).json({ success: true, data: safeUser(user) });
    }
    catch (error) {
        console.error('[me]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.me = me;
const updateProfile = async (req, res) => {
    try {
        const { nom, prenom, telephone, avatarUrl } = req.body;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(nom && { nom }),
                ...(prenom && { prenom }),
                ...(telephone && { telephone }),
                ...(avatarUrl && { avatarUrl }),
            },
        });
        return res.status(200).json({ success: true, data: safeUser(user) });
    }
    catch (error) {
        console.error('[updateProfile]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.updateProfile = updateProfile;
const changePassword = async (req, res) => {
    try {
        const { ancienMotDePasse, nouveauMotDePasse } = req.body;
        const user = await prisma_1.prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ success: false, error: 'Utilisateur introuvable' });
        }
        const isValid = await bcryptjs_1.default.compare(ancienMotDePasse, user.motDePasse);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Ancien mot de passe incorrect' });
        }
        const hashed = await bcryptjs_1.default.hash(nouveauMotDePasse, 12);
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: { motDePasse: hashed } });
        await prisma_1.prisma.session.deleteMany({ where: { userId: user.id } });
        return res.status(200).json({
            success: true,
            data: { message: 'Mot de passe mis à jour. Veuillez vous reconnecter.' },
        });
    }
    catch (error) {
        console.error('[changePassword]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.changePassword = changePassword;
const logout = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token)
            await prisma_1.prisma.session.deleteMany({ where: { token } });
        return res.status(200).json({ success: true, data: { message: 'Déconnexion réussie' } });
    }
    catch (error) {
        console.error('[logout]', error);
        return res.status(500).json({ success: false, error: 'Erreur serveur' });
    }
};
exports.logout = logout;
//# sourceMappingURL=auth.controller.js.map