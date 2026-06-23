 import { Request } from 'express'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: 'COUPLE' | 'PRESTATAIRE' | 'PLANNER' | 'ADMIN'
  }

  body: any
  params: any
  query: any
}