 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import { createWeddingSchema, updateWeddingSchema } from '../schemas/wedding.schema'
import {
  createWedding,
  getWeddings,
  getWedding,
  updateWedding,
  getWeddingStats,
  deleteWedding,
} from '../controllers/wedding.controller'

const router = Router()

// Toutes les routes mariage nécessitent d'être authentifié
router.use(authenticate)

router.post('/', validate(createWeddingSchema), createWedding)
router.get('/', getWeddings)
router.get('/:id', getWedding)
router.patch('/:id', validate(updateWeddingSchema), updateWedding)
router.get('/:id/stats', getWeddingStats)
router.delete('/:id', deleteWedding)

export default router