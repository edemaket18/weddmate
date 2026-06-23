"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Variable d\'environnement manquante: JWT_SECRET');
    }
    return secret;
};
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token)
        return res.status(401).json({ success: false, error: 'Token manquant' });
    try {
        const payload = jsonwebtoken_1.default.verify(token, getJwtSecret());
        const session = await prisma_1.prisma.session.findUnique({ where: { token } });
        if (!session || session.expiresAt <= new Date()) {
            return res.status(401).json({ success: false, error: 'Session expirée ou révoquée' });
        }
        req.user = payload;
        next();
    }
    catch (error) {
        if (error instanceof Error && error.message.includes('JWT_SECRET')) {
            console.error('[auth]', error.message);
            return res.status(500).json({ success: false, error: 'Configuration serveur invalide' });
        }
        return res.status(401).json({ success: false, error: 'Token invalide ou expiré' });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map