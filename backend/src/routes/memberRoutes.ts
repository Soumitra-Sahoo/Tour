import { Router } from 'express';
import { addMember, listMembers, identify } from '../controllers/memberController';
import { requireMember, requireOwner } from '../middleware/identify';

const router = Router({ mergeParams: true });

router.get('/', listMembers);
router.post('/', requireMember, requireOwner, addMember);
router.post('/identify', identify);

export default router;
