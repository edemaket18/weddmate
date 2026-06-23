"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const budget_schema_1 = require("../schemas/budget.schema");
const budget_controller_1 = require("../controllers/budget.controller");
const router = (0, express_1.Router)({ mergeParams: true });
router.use(auth_1.authenticate);
router.post('/', (0, validate_1.validate)(budget_schema_1.createBudgetItemSchema), budget_controller_1.createBudgetItem);
router.get('/', budget_controller_1.getBudget);
router.patch('/:itemId', (0, validate_1.validate)(budget_schema_1.updateBudgetItemSchema), budget_controller_1.updateBudgetItem);
router.delete('/:itemId', budget_controller_1.deleteBudgetItem);
exports.default = router;
//# sourceMappingURL=budget.routes.js.map