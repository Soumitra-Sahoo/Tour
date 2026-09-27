import { Router } from 'express';
import { getCurrentMember, switchOut } from '../controllers/memberController';

const router = Router({ mergeParams: true });

router.get('/', getCurrentMember);
router.post('/switch-out', switchOut);

export default router;
