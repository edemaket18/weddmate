import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
  getGaleriePage,
  uploadPhoto,
  modererPhoto,
  deletePhoto,
} from '../controllers/galerie.controller'

const router = Router()

//Route publique unique
router.get('/gallery/:slug', getGaleriePage)
router.post('/gallery/:slug/photos', uploadPhoto)

//Routes protégées (mariés)
router.patch('/api/weddings/:id/galerie/:photoId', authenticate, modererPhoto)
router.delete('/api/weddings/:id/galerie/:photoId', authenticate, deletePhoto)

export default router








/*import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
  getGaleriePage,
  getGalerieData,
  getGalerieOwnerData,
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
router.get('/api/weddings/:id/galerie', authenticate, getGalerieOwnerData)
router.patch('/api/weddings/:id/galerie/:photoId', authenticate, modererPhoto)
router.delete('/api/weddings/:id/galerie/:photoId', authenticate, deletePhoto)

export default router
*/