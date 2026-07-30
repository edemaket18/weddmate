"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const wedding_schema_1 = require("../schemas/wedding.schema");
const wedding_controller_1 = require("../controllers/wedding.controller");
const router = (0, express_1.Router)();
// Toutes les routes mariage nécessitent d'être authentifié
router.use(auth_1.authenticate);
router.post('/', (0, validate_1.validate)(wedding_schema_1.createWeddingSchema), wedding_controller_1.createWedding);
router.get('/', wedding_controller_1.getWeddings);
router.get('/:id', wedding_controller_1.getWedding);
router.patch('/:id', (0, validate_1.validate)(wedding_schema_1.updateWeddingSchema), wedding_controller_1.updateWedding);
router.get('/:id/stats', wedding_controller_1.getWeddingStats);
router.delete('/:id', wedding_controller_1.deleteWedding);
exports.default = router;
//# sourceMappingURL=wedding.routes.js.map