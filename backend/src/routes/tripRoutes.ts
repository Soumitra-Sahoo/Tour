import { Router } from 'express';
import { createTrip, getTripByShareToken, lockTrip, reopenTrip, setTreasurer } from '../controllers/tripController';
import { requireMember, requireOwner } from '../middleware/identify';

const router = Router();

router.post('/', createTrip);
router.get('/:shareToken', getTripByShareToken);
router.post('/:tripId/lock', requireMember, requireOwner, lockTrip);
router.post('/:tripId/reopen', requireMember, requireOwner, reopenTrip);
router.post('/:tripId/treasurer', requireMember, requireOwner, setTreasurer);

export default router;
