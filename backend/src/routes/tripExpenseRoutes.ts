import { Router } from 'express';
import { createExpense, listExpenses } from '../controllers/expenseController';
import { requireMember } from '../middleware/identify';

const router = Router({ mergeParams: true });

router.get('/', requireMember, listExpenses);
router.post('/', requireMember, createExpense);

export default router;
