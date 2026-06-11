 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import { rsvpSchema, addInviteManuelSchema, updateInviteSchema } from '../schemas/rsvp.schema'
import {
  getRsvpPage,getRsvpInfo,submitRsvp,getInvites, addInviteManuel, updateInvite, deleteInvite, getRsvpStats,
} from '../controllers/rsvp.controller'

const router = Router()

// Routes publiques RSVP (sans auth)
//router.get('/rsvp/:slug', getRsvpInfo)
//router.post('/rsvp/:slug', validate(rsvpSchema), submitRsvp)
router.get('/rsvp/:slug', getRsvpPage)
router.get('/rsvp/:slug/info', getRsvpInfo)
router.post('/rsvp/:slug', validate(rsvpSchema), submitRsvp)

// Routes protégées invités
router.get('/api/weddings/:id/invites', authenticate, getInvites)
router.post('/api/weddings/:id/invites', authenticate, validate(addInviteManuelSchema), addInviteManuel)
router.patch('/api/weddings/:id/invites/:inviteId', authenticate, validate(updateInviteSchema), updateInvite)
router.delete('/api/weddings/:id/invites/:inviteId', authenticate, deleteInvite)
router.get('/api/weddings/:id/rsvp-stats', authenticate, getRsvpStats)

export default router