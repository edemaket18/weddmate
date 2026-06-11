 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import { createTacheSchema, updateTacheSchema } from '../schemas/tache.schema'
import {
  getTaches,
  createTache,
  updateTache,
  toggleTache,
  deleteTache,
  clearTaches,
} from '../controllers/tache.controller'

const router = Router({ mergeParams: true })
router.use(authenticate)

router.get('/', getTaches)
router.post('/', validate(createTacheSchema), createTache)
router.patch('/:tacheId', validate(updateTacheSchema), updateTache)
router.post('/:tacheId/toggle', toggleTache)
router.delete('/:tacheId', deleteTache)
router.delete('/', clearTaches)   // ?faiteOnly=true pour vider uniquement les faites

export default router