 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { getRappels, createRappel, retryRappel } from '../controllers/rappel.controller'

const router = Router({ mergeParams: true })
router.use(authenticate)

router.get('/', getRappels)
router.post('/', createRappel)
router.post('/:rappelId/retry', retryRappel)

export default router