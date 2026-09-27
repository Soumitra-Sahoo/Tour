import { Router } from 'express';
import { listSettlements, markSettlementPaid } from '../controllers/settlementController';
import { requireMember } from '../middleware/identify';

// Nested under /api/trip/:tripId/settlements
export const tripSettlementRouter = Router({ mergeParams: true });
tripSettlementRouter.get('/', requireMember, listSettlements);

// Top-level /api/settlements/:settlementId/mark-paid
export const settlementActionRouter = Router();
settlementActionRouter.post('/:settlementId/mark-paid', requireMember, markSettlementPaid);
