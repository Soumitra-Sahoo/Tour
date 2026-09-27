import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Advance } from '../models/Advance';
import { Member } from '../models/Member';
import { Trip } from '../models/Trip';
import { addAdvanceSchema, updateAdvanceSchema } from '../validation/schemas';
import { rupeesToPaise } from '../services/money';
import { reconcileSettlements } from '../services/settlementService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ForbiddenError, NotFoundError } from '../utils/AppError';

async function assertActiveTrip(tripId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new NotFoundError('Trip not found.');
  if (trip.status === 'locked') throw new AppError('This trip is locked.', 403);
  return trip;
}

async function assertMemberInTrip(tripId: string, memberId: string) {
  const member = await Member.findOne({ _id: memberId, tripId });
  if (!member) throw new AppError('This person is not part of the trip.', 400);
}

export const listAdvances = asyncHandler(async (req: Request, res: Response) => {
  const advances = await Advance.find({ tripId: req.params.tripId }).sort({ createdAt: -1 });
  res.json({
    advances: advances.map(serializeAdvance),
  });
});

export const createAdvance = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const input = addAdvanceSchema.parse(req.body);
  await assertActiveTrip(tripId);

  // A member can add an advance only for themselves. The owner can add one for any member.
  if (!req.currentMember!.isOwner && req.currentMember!.id !== input.memberId) {
    throw new ForbiddenError('You can only add an advance for yourself.');
  }
  await assertMemberInTrip(tripId, input.memberId);

  const advance = await Advance.create({
    tripId,
    memberId: input.memberId,
    amountPaise: rupeesToPaise(input.amount),
    note: input.note,
    createdBy: req.currentMember!.id,
  });

  await reconcileSettlements(tripId);
  res.status(201).json({ advance: serializeAdvance(advance) });
});

export const updateAdvance = asyncHandler(async (req: Request, res: Response) => {
  const advance = await Advance.findById(req.params.advanceId);
  if (!advance) throw new NotFoundError('Advance not found.');
  if (req.currentMember!.tripId !== advance.tripId.toString()) throw new NotFoundError('Advance not found.');
  await assertActiveTrip(advance.tripId.toString());

  if (!req.currentMember!.isOwner && advance.createdBy.toString() !== req.currentMember!.id) {
    throw new ForbiddenError("You don't have permission to modify this advance.");
  }

  const input = updateAdvanceSchema.parse(req.body);
  if (input.memberId !== undefined) {
    if (!req.currentMember!.isOwner && input.memberId !== req.currentMember!.id) {
      throw new ForbiddenError('You can only add an advance for yourself.');
    }
    await assertMemberInTrip(advance.tripId.toString(), input.memberId);
    advance.memberId = new Types.ObjectId(input.memberId);
  }
  if (input.amount !== undefined) advance.amountPaise = rupeesToPaise(input.amount);
  if (input.note !== undefined) advance.note = input.note;
  await advance.save();
  await reconcileSettlements(advance.tripId.toString());
  res.json({ advance: serializeAdvance(advance) });
});

export const deleteAdvance = asyncHandler(async (req: Request, res: Response) => {
  const advance = await Advance.findById(req.params.advanceId);
  if (!advance) throw new NotFoundError('Advance not found.');
  if (req.currentMember!.tripId !== advance.tripId.toString()) throw new NotFoundError('Advance not found.');
  await assertActiveTrip(advance.tripId.toString());
  if (!req.currentMember!.isOwner && advance.createdBy.toString() !== req.currentMember!.id) {
    throw new ForbiddenError("You don't have permission to delete this advance.");
  }
  const tripId = advance.tripId.toString();
  await advance.deleteOne();
  await reconcileSettlements(tripId);
  res.json({ ok: true });
});

function serializeAdvance(advance: InstanceType<typeof Advance>) {
  return {
    id: advance._id,
    memberId: advance.memberId,
    amountPaise: advance.amountPaise,
    note: advance.note,
    createdBy: advance.createdBy,
    createdAt: advance.createdAt,
    updatedAt: advance.updatedAt,
  };
}
