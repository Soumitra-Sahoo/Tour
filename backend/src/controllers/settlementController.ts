import { Request, Response } from 'express';
import { Settlement } from '../models/Settlement';
import { reconcileSettlements } from '../services/settlementService';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/AppError';

export const listSettlements = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  // Recompute pending settlements against the latest ledger before returning.
  const { settlements } = await reconcileSettlements(tripId);
  const sorted = [...settlements].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return (b.paidAt?.getTime() ?? b.createdAt.getTime()) - (a.paidAt?.getTime() ?? a.createdAt.getTime());
  });

  res.json({
    settlements: sorted.map((s) => ({
      id: s._id,
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amountPaise: s.amountPaise,
      status: s.status,
      createdAt: s.createdAt,
      paidAt: s.paidAt,
    })),
  });
});

export const markSettlementPaid = asyncHandler(async (req: Request, res: Response) => {
  const settlement = await Settlement.findById(req.params.settlementId);
  if (!settlement) throw new NotFoundError('Settlement not found.');

  settlement.status = 'paid';
  settlement.paidAt = new Date();
  await settlement.save();

  res.json({
    settlement: {
      id: settlement._id,
      fromMemberId: settlement.fromMemberId,
      toMemberId: settlement.toMemberId,
      amountPaise: settlement.amountPaise,
      status: settlement.status,
      paidAt: settlement.paidAt,
    },
  });
});
