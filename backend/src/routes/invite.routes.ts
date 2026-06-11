 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import { addInviteManuelSchema, updateInviteSchema } from '../schemas/rsvp.schema'
import {
  getInvites,
  addInviteManuel,
  updateInvite,
  deleteInvite,
  getRsvpStats,
} from '../controllers/rsvp.controller'

const router = Router({ mergeParams: true })
router.use(authenticate)

router.get('/', getInvites)
router.post('/', validate(addInviteManuelSchema), addInviteManuel)
router.patch('/:inviteId', validate(updateInviteSchema), updateInvite)
router.delete('/:inviteId', deleteInvite)
router.get('/stats', getRsvpStats)

export default router