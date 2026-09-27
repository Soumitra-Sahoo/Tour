import { Router } from 'express';
import { listCategories, addCategory } from '../controllers/categoryController';
import { requireMember, requireOwner } from '../middleware/identify';

const router = Router({ mergeParams: true });

router.get('/', listCategories);
router.post('/', requireMember, requireOwner, addCategory);

export default router;
