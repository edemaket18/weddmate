import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
  getGaleriePage,
  getGalerieData,
  uploadPhoto,
  modererPhoto,
  deletePhoto,
} from '../controllers/galerie.controller'

const router = Router()

//Routes PUBLIQUES
router.get('/gallery/:slug', getGaleriePage)
router.get('/gallery/:slug/data', getGalerieData)
router.post('/gallery/:slug/photos', uploadPhoto)

//Routes PROTÉGÉES
router.patch('/api/weddings/:id/galerie/:photoId', authenticate, modererPhoto)
router.delete('/api/weddings/:id/galerie/:photoId', authenticate, deletePhoto)

export default router