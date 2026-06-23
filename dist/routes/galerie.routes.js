"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const galerie_controller_1 = require("../controllers/galerie.controller");
const router = (0, express_1.Router)();
router.get('/gallery/:slug', galerie_controller_1.getGaleriePage);
router.get('/gallery/:slug/data', galerie_controller_1.getGalerieData);
router.post('/gallery/:slug/photos', galerie_controller_1.uploadPhoto);
router.patch('/api/weddings/:id/galerie/:photoId', auth_1.authenticate, galerie_controller_1.modererPhoto);
router.delete('/api/weddings/:id/galerie/:photoId', auth_1.authenticate, galerie_controller_1.deletePhoto);
exports.default = router;
//# sourceMappingURL=galerie.routes.js.map