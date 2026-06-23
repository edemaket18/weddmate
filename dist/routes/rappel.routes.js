"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const rappel_controller_1 = require("../controllers/rappel.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_1.authenticate);
router.get('/', rappel_controller_1.getRappels);
router.post('/', rappel_controller_1.createRappel);
router.post('/:rappelId/retry', rappel_controller_1.retryRappel);
exports.default = router;
//# sourceMappingURL=rappel.routes.js.map