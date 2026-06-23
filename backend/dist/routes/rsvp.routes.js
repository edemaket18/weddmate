"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const rsvp_schema_1 = require("../schemas/rsvp.schema");
const rsvp_controller_1 = require("../controllers/rsvp.controller");
const router = (0, express_1.Router)();
//Route publique unique 
router.get('/rsvp/:slug', rsvp_controller_1.getRsvpPage);
router.post('/rsvp/:slug', (0, validate_1.validate)(rsvp_schema_1.rsvpSchema), rsvp_controller_1.submitRsvp);
//Routes invités protégées (mariés)
router.get('/api/weddings/:id/invites', auth_1.authenticate, rsvp_controller_1.getInvites);
router.post('/api/weddings/:id/invites', auth_1.authenticate, (0, validate_1.validate)(rsvp_schema_1.addInviteManuelSchema), rsvp_controller_1.addInviteManuel);
router.patch('/api/weddings/:id/invites/:inviteId', auth_1.authenticate, (0, validate_1.validate)(rsvp_schema_1.updateInviteSchema), rsvp_controller_1.updateInvite);
router.delete('/api/weddings/:id/invites/:inviteId', auth_1.authenticate, rsvp_controller_1.deleteInvite);
router.get('/api/weddings/:id/invites/stats', auth_1.authenticate, rsvp_controller_1.getRsvpStats);
exports.default = router;
/*import { Router } from 'express'
import { validate } from '../middlewares/validate'
import { rsvpSchema } from '../schemas/rsvp.schema'
import {
  getRsvpPage,
  getRsvpInfo,
  submitRsvp,
} from '../controllers/rsvp.controller'

const router = Router()

// Routes publiques RSVP (sans auth)
//router.get('/rsvp/:slug', getRsvpInfo)
//router.post('/rsvp/:slug', validate(rsvpSchema), submitRsvp)
router.get('/rsvp/:slug', getRsvpPage)
router.get('/rsvp/:slug/info', getRsvpInfo)
router.post('/rsvp/:slug', validate(rsvpSchema), submitRsvp)

export default router
*/ 
//# sourceMappingURL=rsvp.routes.js.map