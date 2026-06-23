"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const tache_schema_1 = require("../schemas/tache.schema");
const tache_controller_1 = require("../controllers/tache.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_1.authenticate);
router.get('/', tache_controller_1.getTaches);
router.post('/', (0, validate_1.validate)(tache_schema_1.createTacheSchema), tache_controller_1.createTache);
router.patch('/:tacheId', (0, validate_1.validate)(tache_schema_1.updateTacheSchema), tache_controller_1.updateTache);
router.post('/:tacheId/toggle', tache_controller_1.toggleTache);
router.delete('/:tacheId', tache_controller_1.deleteTache);
router.delete('/', tache_controller_1.clearTaches); // ?faiteOnly=true pour vider uniquement les faites
exports.default = router;
//# sourceMappingURL=tache.routes.js.map