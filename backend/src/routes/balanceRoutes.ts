import { Router } from 'express';
import { getBalances, getSummary } from '../controllers/balanceController';
import { requireMember } from '../middleware/identify';

const router = Router({ mergeParams: true });

router.get('/', requireMember, getBalances);

export default router;

export const summaryRouter = Router({ mergeParams: true });
summaryRouter.get('/', requireMember, getSummary);
