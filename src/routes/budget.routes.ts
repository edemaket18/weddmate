 import { Router } from 'express'
import { authenticate } from '../middlewares/auth'
import { validate } from '../middlewares/validate'
import { createBudgetItemSchema, updateBudgetItemSchema } from '../schemas/budget.schema'
import { createBudgetItem, getBudget, updateBudgetItem, deleteBudgetItem } from '../controllers/budget.controller'

const router = Router({ mergeParams: true })
router.use(authenticate)

router.post('/', validate(createBudgetItemSchema), createBudgetItem)
router.get('/', getBudget)
router.patch('/:itemId', validate(updateBudgetItemSchema), updateBudgetItem)
router.delete('/:itemId', deleteBudgetItem)

export default router