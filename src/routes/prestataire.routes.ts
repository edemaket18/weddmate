 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import {
  addPrestataireSchema,
  updatePrestataireSchema,
  evaluationSchema,
} from '../schemas/prestataire.schema'
import {
  addPrestataire,
  getPrestataires,
  getPrestataire,
  updatePrestataire,
  removePrestataire,
  evaluerPrestataire,
} from '../controllers/prestataire.controller'

const router = Router({ mergeParams: true })

router.use(authenticate)

router.post('/', validate(addPrestataireSchema), addPrestataire)
router.get('/', getPrestataires)
router.get('/:prestId', getPrestataire)
router.patch('/:prestId', validate(updatePrestataireSchema), updatePrestataire)
router.delete('/:prestId', removePrestataire)
router.post('/:prestId/evaluation', validate(evaluationSchema), evaluerPrestataire)

export default router