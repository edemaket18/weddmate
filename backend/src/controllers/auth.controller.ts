 import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { AuthRequest } from '../types'
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
} from '../schemas/auth.schema'
import { prisma } from '../lib/prisma'

//const prisma = new PrismaClient()


const signToken = (payload: { id: string; email: string; role: string }) => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions)
}

const safeUser = (user: {
  id: string
  email: string
  nom: string
  prenom: string
  telephone: string | null
  role: string
  avatarUrl: string | null
  createdAt: Date
}) => ({
  id: user.id,
  email: user.email,
  nom: user.nom,
  prenom: user.prenom,
  telephone: user.telephone,
  role: user.role,
  avatarUrl: user.avatarUrl,
  createdAt: user.createdAt,
})


export const register = async (
  req: Request<{}, {}, RegisterInput>,
  res: Response
) => {
  try {
    const { email, motDePasse, nom, prenom, telephone, role } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé',
      })
    }

    if (telephone) {
      const existingPhone = await prisma.user.findUnique({
        where: { telephone },
      })
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          error: 'Ce numéro de téléphone est déjà utilisé',
        })
      }
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 12)

    const user = await prisma.user.create({
      data: {
        email,
        motDePasse: hashedPassword,
        nom,
        prenom,
        telephone: telephone ?? null,
        role,
      },
    })

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return res.status(201).json({
      success: true,
      data: { user: safeUser(user), token },
    })
  } catch (error) {
    console.error('[register]', error)
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la création du compte',
    })
  }
}


export const login = async (
  req: Request<{}, {}, LoginInput>,
  res: Response
) => {
  try {
    const { email, motDePasse } = req.body

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect',
      })
    }

    const isValid = await bcrypt.compare(motDePasse, user.motDePasse)
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect',
      })
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })

    return res.status(200).json({
      success: true,
      data: { user: safeUser(user), token },
    })
  } catch (error) {
    console.error('[login]', error)
    return res.status(500).json({
      success: false,
      error: 'Erreur lors de la connexion',
    })
  }
}


export const me = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    })
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })
    }
    return res.status(200).json({ success: true, data: safeUser(user) })
  } catch (error) {
    console.error('[me]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const { nom, prenom, telephone, avatarUrl } = req.body
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(telephone && { telephone }),
        ...(avatarUrl && { avatarUrl }),
      },
    })
    return res.status(200).json({ success: true, data: safeUser(user) })
  } catch (error) {
    console.error('[updateProfile]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body as ChangePasswordInput

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur introuvable' })
    }

    const isValid = await bcrypt.compare(ancienMotDePasse, user.motDePasse)
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Ancien mot de passe incorrect' })
    }

    const hashed = await bcrypt.hash(nouveauMotDePasse, 12)
    await prisma.user.update({ where: { id: user.id }, data: { motDePasse: hashed } })
    await prisma.session.deleteMany({ where: { userId: user.id } })

    return res.status(200).json({
      success: true,
      data: { message: 'Mot de passe mis à jour. Veuillez vous reconnecter.' },
    })
  } catch (error) {
    console.error('[changePassword]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}


export const logout = async (req: AuthRequest, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    if (token) await prisma.session.deleteMany({ where: { token } })
    return res.status(200).json({ success: true, data: { message: 'Déconnexion réussie' } })
  } catch (error) {
    console.error('[logout]', error)
    return res.status(500).json({ success: false, error: 'Erreur serveur' })
  }
}