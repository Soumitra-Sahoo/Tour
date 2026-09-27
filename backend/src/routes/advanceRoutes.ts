import { Router } from 'express';
import { createAdvance, deleteAdvance, listAdvances, updateAdvance } from '../controllers/advanceController';
import { requireMember } from '../middleware/identify';

const router = Router({ mergeParams: true });
router.get('/', requireMember, listAdvances);
router.post('/', requireMember, createAdvance);

export const advanceActionRouter = Router();
advanceActionRouter.patch('/:advanceId', requireMember, updateAdvance);
advanceActionRouter.delete('/:advanceId', requireMember, deleteAdvance);

export default router;
