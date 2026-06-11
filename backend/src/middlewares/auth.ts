import { Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AuthRequest } from '../types'

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, error: 'Token manquant' })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || '') as AuthRequest['user']
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalide ou expiré' })
  }
}
