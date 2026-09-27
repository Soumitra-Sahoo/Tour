import { Router } from 'express';
import { getExpense, updateExpense, deleteExpense } from '../controllers/expenseController';
import { requireMember } from '../middleware/identify';

const router = Router();

router.get('/:expenseId', requireMember, getExpense);
router.patch('/:expenseId', requireMember, updateExpense);
router.delete('/:expenseId', requireMember, deleteExpense);

export default router;
