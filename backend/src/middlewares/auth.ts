import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest } from '../types'
import { prisma } from '../lib/prisma'

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('Variable d\'environnement manquante: JWT_SECRET')
  }
  return secret
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, error: 'Token manquant' })

  try {
    const payload = jwt.verify(token, getJwtSecret()) as AuthRequest['user']

    const session = await prisma.session.findUnique({ where: { token } })
    if (!session || session.expiresAt <= new Date()) {
      return res.status(401).json({ success: false, error: 'Session expirée ou révoquée' })
    }

    req.user = payload
    next()
  } catch (error) {
    if (error instanceof Error && error.message.includes('JWT_SECRET')) {
      console.error('[auth]', error.message)
      return res.status(500).json({ success: false, error: 'Configuration serveur invalide' })
    }
    return res.status(401).json({ success: false, error: 'Token invalide ou expiré' })
  }
}
