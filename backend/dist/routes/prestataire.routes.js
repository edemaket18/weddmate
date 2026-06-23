"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const prestataire_schema_1 = require("../schemas/prestataire.schema");
const prestataire_controller_1 = require("../controllers/prestataire.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_1.authenticate);
router.post('/', (0, validate_1.validate)(prestataire_schema_1.addPrestataireSchema), prestataire_controller_1.addPrestataire);
router.get('/', prestataire_controller_1.getPrestataires);
router.get('/:prestId', prestataire_controller_1.getPrestataire);
router.patch('/:prestId', (0, validate_1.validate)(prestataire_schema_1.updatePrestataireSchema), prestataire_controller_1.updatePrestataire);
router.delete('/:prestId', prestataire_controller_1.removePrestataire);
router.post('/:prestId/evaluation', (0, validate_1.validate)(prestataire_schema_1.evaluationSchema), prestataire_controller_1.evaluerPrestataire);
exports.default = router;
//# sourceMappingURL=prestataire.routes.js.map