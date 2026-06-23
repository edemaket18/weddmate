"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const galerie_controller_1 = require("../controllers/galerie.controller");
const router = (0, express_1.Router)();
//Route publique unique
router.get('/gallery/:slug', galerie_controller_1.getGaleriePage);
router.post('/gallery/:slug/photos', galerie_controller_1.uploadPhoto);
//Routes protégées (mariés)
router.patch('/api/weddings/:id/galerie/:photoId', auth_1.authenticate, galerie_controller_1.modererPhoto);
router.delete('/api/weddings/:id/galerie/:photoId', auth_1.authenticate, galerie_controller_1.deletePhoto);
exports.default = router;
/*import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import {
  getGaleriePage,
  getGalerieData,
  getGalerieOwnerData,
  uploadPhoto,
  modererPhoto,
  deletePhoto,
} from '../controllers/galerie.controller'

const router = Router()

//Routes PUBLIQUES
router.get('/gallery/:slug', getGaleriePage)
router.get('/gallery/:slug/data', getGalerieData)
router.post('/gallery/:slug/photos', uploadPhoto)

//Routes PROTÉGÉES
router.get('/api/weddings/:id/galerie', authenticate, getGalerieOwnerData)
router.patch('/api/weddings/:id/galerie/:photoId', authenticate, modererPhoto)
router.delete('/api/weddings/:id/galerie/:photoId', authenticate, deletePhoto)

export default router
*/ 
//# sourceMappingURL=galerie.routes.js.map