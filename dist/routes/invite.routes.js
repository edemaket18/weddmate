"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const rsvp_schema_1 = require("../schemas/rsvp.schema");
const rsvp_controller_1 = require("../controllers/rsvp.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_1.authenticate);
router.get('/', rsvp_controller_1.getInvites);
router.post('/', (0, validate_1.validate)(rsvp_schema_1.addInviteManuelSchema), rsvp_controller_1.addInviteManuel);
router.patch('/:inviteId', (0, validate_1.validate)(rsvp_schema_1.updateInviteSchema), rsvp_controller_1.updateInvite);
router.delete('/:inviteId', rsvp_controller_1.deleteInvite);
router.get('/stats', rsvp_controller_1.getRsvpStats);
exports.default = router;
//# sourceMappingURL=invite.routes.js.map