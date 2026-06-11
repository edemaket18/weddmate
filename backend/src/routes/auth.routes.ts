 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../schemas/auth.schema'
import {
  register,
  login,
  me,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/auth.controller'

const router = Router()

//Routes publiques 
router.post('/register', validate(registerSchema), register)
router.post('/login', validate(loginSchema), login)

//Routes protégées 
router.get('/me', authenticate, me)
router.patch('/profile', authenticate, updateProfile)
router.patch('/password', authenticate, validate(changePasswordSchema), changePassword)
router.post('/logout', authenticate, logout)

export default router