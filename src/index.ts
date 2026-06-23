 import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import path from 'path'

import authRoutes from './routes/auth.routes'
import weddingRoutes from './routes/wedding.routes'
import prestataireRoutes from './routes/prestataire.routes'
import budgetRoutes from './routes/budget.routes'
import inviteRoutes from './routes/invite.routes'
import tacheRoutes from './routes/tache.routes'
import rappelRoutes from './routes/rappel.routes'
import rsvpRoutes from './routes/rsvp.routes'
import galerieRoutes from './routes/galerie.routes'
import { startCronJobs } from './services/cron.service'

const app = express()
const PORT = Number(process.env.PORT) || 3001
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc:  ["'self'"],
        scriptSrc:   ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc:    ["'self'", "'unsafe-inline'"],   // ← FIX CSS inline
        imgSrc:      ["'self'", "data:", "https:", "blob:"], // ← FIX images Supabase
        connectSrc:  ["'self'", "*"],                 // ← FIX fetch API
        fontSrc:     ["'self'", "https:", "data:"],
        objectSrc:   ["'none'"],
        mediaSrc:    ["'self'"],
        frameSrc:    ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,   // ← FIX chargement ressources
  })
)

app.use(cors({ origin: '*' }))
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})
app.use(express.json({ limit: '10mb' }))
app.use(morgan('dev'))

app.use(express.static(path.join(process.cwd(), 'public')))

//Rate limiter 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: 'Trop de tentatives, réessayez dans 15 minutes.' },
})

//Health
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'WeddMate API opérationnelle 💍', version: '1.0.0' })
})

//Routes API protégées
app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/weddings', weddingRoutes)
app.use('/api/weddings/:id/prestataires', prestataireRoutes)
app.use('/api/weddings/:id/budget', budgetRoutes)
app.use('/api/weddings/:id/invites', inviteRoutes)   
app.use('/api/weddings/:id/taches', tacheRoutes)
app.use('/api/weddings/:id/rappels', rappelRoutes)


//Routes publiques RSVP + Galerie
app.use(rsvpRoutes)
app.use(galerieRoutes)

//404
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route introuvable' })
})

//Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({ success: false, error: 'Erreur interne du serveur' })
})

//Démarrage
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 WeddMate API démarrée sur http://localhost:${PORT}`)
  startCronJobs()
})

export default app