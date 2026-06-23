"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const wedding_routes_1 = __importDefault(require("./routes/wedding.routes"));
const prestataire_routes_1 = __importDefault(require("./routes/prestataire.routes"));
const budget_routes_1 = __importDefault(require("./routes/budget.routes"));
const invite_routes_1 = __importDefault(require("./routes/invite.routes"));
const tache_routes_1 = __importDefault(require("./routes/tache.routes"));
const rappel_routes_1 = __importDefault(require("./routes/rappel.routes"));
const rsvp_routes_1 = __importDefault(require("./routes/rsvp.routes"));
const galerie_routes_1 = __importDefault(require("./routes/galerie.routes"));
const cron_service_1 = require("./services/cron.service");
const app = (0, express_1.default)();
const PORT = Number(process.env.PORT) || 3001;
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"], // ← FIX CSS inline
            imgSrc: ["'self'", "data:", "https:", "blob:"], // ← FIX images Supabase
            connectSrc: ["'self'", "*"], // ← FIX fetch API
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false, // ← FIX chargement ressources
}));
app.use((0, cors_1.default)({ origin: '*' }));
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
});
app.use(express_1.default.json({ limit: '10mb' }));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.static(path_1.default.join(process.cwd(), 'public')));
//Rate limiter 
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Trop de tentatives, réessayez dans 15 minutes.' },
});
//Health
app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'WeddMate API opérationnelle 💍', version: '1.0.0' });
});
//Routes API protégées
app.use('/api/auth', authLimiter, auth_routes_1.default);
app.use('/api/weddings', wedding_routes_1.default);
app.use('/api/weddings/:id/prestataires', prestataire_routes_1.default);
app.use('/api/weddings/:id/budget', budget_routes_1.default);
app.use('/api/weddings/:id/invites', invite_routes_1.default);
app.use('/api/weddings/:id/taches', tache_routes_1.default);
app.use('/api/weddings/:id/rappels', rappel_routes_1.default);
//Routes publiques RSVP + Galerie
app.use(rsvp_routes_1.default);
app.use(galerie_routes_1.default);
//404
app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Route introuvable' });
});
//Error handler
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, error: 'Erreur interne du serveur' });
});
//Démarrage
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WeddMate API démarrée sur http://localhost:${PORT}`);
    (0, cron_service_1.startCronJobs)();
});
exports.default = app;
//# sourceMappingURL=index.js.map