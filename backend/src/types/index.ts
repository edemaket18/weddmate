import { Request } from 'express'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  meta?: { total?: number; page?: number; perPage?: number }
}

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: 'COUPLE' | 'PRESTATAIRE' | 'PLANNER' | 'ADMIN' }
}
