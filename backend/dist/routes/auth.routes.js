"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const auth_schema_1 = require("../schemas/auth.schema");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
//Routes publiques 
router.post('/register', (0, validate_1.validate)(auth_schema_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validate_1.validate)(auth_schema_1.loginSchema), auth_controller_1.login);
//Routes protégées 
router.get('/me', auth_1.authenticate, auth_controller_1.me);
router.patch('/profile', auth_1.authenticate, auth_controller_1.updateProfile);
router.patch('/password', auth_1.authenticate, (0, validate_1.validate)(auth_schema_1.changePasswordSchema), auth_controller_1.changePassword);
router.post('/logout', auth_1.authenticate, auth_controller_1.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map