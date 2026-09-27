import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Expense } from '../models/Expense';
import { Trip } from '../models/Trip';
import { Member } from '../models/Member';
import { createExpenseSchema, updateExpenseSchema } from '../validation/schemas';
import { rupeesToPaise, MoneyError } from '../services/money';
import { computeEqualSplit, validateCustomSplit, validatePayers } from '../services/splitEngine';
import { reconcileSettlements } from '../services/settlementService';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, ForbiddenError, NotFoundError } from '../utils/AppError';

async function assertTripActive(tripId: string) {
  const trip = await Trip.findById(tripId);
  if (!trip) throw new NotFoundError('Trip not found.');
  if (trip.status === 'locked') throw new AppError('This trip is locked.', 403);
  return trip;
}

async function assertMembersBelongToTrip(tripId: string, memberIds: string[]) {
  const unique = Array.from(new Set(memberIds));
  const count = await Member.countDocuments({ tripId, _id: { $in: unique } });
  if (count !== unique.length) {
    throw new AppError('One of the selected people is not part of this trip.', 400);
  }
}

function buildSharesFromInput(
  input: { memberId: string; amount?: string | number }[],
  allowZero: boolean,
): { memberId: string; amountPaise: number }[] {
  return input.map((s) => ({
    memberId: s.memberId,
    amountPaise: s.amount === undefined ? 0 : rupeesToPaise(s.amount, allowZero),
  }));
}

/**
 * Resolves amount+payers+participants+splitType from a parsed request body
 * into fully-validated, exact-paise payer/participant share lists.
 */
async function resolveExpenseAccounting(
  tripId: string,
  ownerId: string | null,
  input: {
    amount: string | number;
    payers: { memberId: string; amount?: string | number }[];
    participantIds: string[];
    splitType: 'equal' | 'custom';
    customShares?: { memberId: string; amount?: string | number }[];
  },
) {
  const amountPaise = rupeesToPaise(input.amount);

  await assertMembersBelongToTrip(
    tripId,
    [...input.payers.map((p) => p.memberId), ...input.participantIds],
  );

  // Payers: if a single payer with no explicit amount, they pay the full amount.
  let payerShares: { memberId: string; amountPaise: number }[];
  if (input.payers.length === 1 && input.payers[0].amount === undefined) {
    payerShares = [{ memberId: input.payers[0].memberId, amountPaise: amountPaise }];
  } else {
    payerShares = buildSharesFromInput(input.payers, false);
  }
  payerShares = validatePayers(amountPaise, payerShares);

  let participantShares;
  if (input.splitType === 'equal') {
    participantShares = computeEqualSplit(amountPaise, input.participantIds, ownerId);
  } else {
    if (!input.customShares) {
      throw new MoneyError('Custom split requires an amount for every participant.');
    }
    const shares = buildSharesFromInput(input.customShares, true);
    participantShares = validateCustomSplit(amountPaise, shares);
  }

  return { amountPaise, payerShares, participantShares };
}

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const input = createExpenseSchema.parse(req.body);
  const trip = await assertTripActive(tripId);

  // Idempotency: if this exact key was already used for this trip, return the existing expense.
  const existing = await Expense.findOne({ tripId, idempotencyKey: input.idempotencyKey });
  if (existing) {
    return res.status(200).json({ expense: serializeExpense(existing) });
  }

  const { amountPaise, payerShares, participantShares } = await resolveExpenseAccounting(
    tripId,
    trip.ownerId?.toString() ?? null,
    input,
  );

  let expense;
  try {
    expense = await Expense.create({
      tripId,
      note: input.note,
      category: input.category,
      amountPaise,
      splitType: input.splitType,
      payers: payerShares.map((p) => ({ memberId: p.memberId, amountPaise: p.amountPaise })),
      participants: participantShares.map((p) => ({
        memberId: p.memberId,
        amountPaise: p.amountPaise,
      })),
      createdBy: req.currentMember!.id,
      idempotencyKey: input.idempotencyKey,
    });
  } catch (err: unknown) {
    // A duplicate idempotency key race (double-tap) - return the winning document.
    if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
      const winner = await Expense.findOne({ tripId, idempotencyKey: input.idempotencyKey });
      if (winner) return res.status(200).json({ expense: serializeExpense(winner) });
    }
    throw err;
  }

  await reconcileSettlements(tripId);

  return res.status(201).json({ expense: serializeExpense(expense) });
});

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const expenses = await Expense.find({ tripId }).sort({ createdAt: -1 });
  res.json({ expenses: expenses.map(serializeExpense) });
});

export const getExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findById(req.params.expenseId);
  if (!expense) throw new NotFoundError('Expense not found.');
  if (req.currentMember!.tripId !== expense.tripId.toString()) {
    throw new NotFoundError('Expense not found.');
  }
  res.json({ expense: serializeExpense(expense) });
});

async function assertCanModify(expense: { tripId: Types.ObjectId; createdBy: Types.ObjectId }, req: Request) {
  const trip = await assertTripActive(expense.tripId.toString());
  const current = req.currentMember!;

  // A member's owner/creator powers only apply within their own trip.
  if (current.tripId !== expense.tripId.toString()) {
    throw new ForbiddenError("You don't have permission to modify this expense.");
  }

  const isCreator = expense.createdBy.toString() === current.id;
  if (!isCreator && !current.isOwner) {
    throw new ForbiddenError("You don't have permission to modify this expense.");
  }
  return trip;
}

export const updateExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findById(req.params.expenseId);
  if (!expense) throw new NotFoundError('Expense not found.');

  const trip = await assertCanModify(expense, req);
  const input = updateExpenseSchema.parse(req.body);

  const { amountPaise, payerShares, participantShares } = await resolveExpenseAccounting(
    expense.tripId.toString(),
    trip.ownerId?.toString() ?? null,
    input,
  );

  expense.note = input.note;
  expense.category = input.category;
  expense.amountPaise = amountPaise;
  expense.splitType = input.splitType;
  expense.payers = payerShares.map((p) => ({
    memberId: new Types.ObjectId(p.memberId),
    amountPaise: p.amountPaise,
  }));
  expense.participants = participantShares.map((p) => ({
    memberId: new Types.ObjectId(p.memberId),
    amountPaise: p.amountPaise,
  }));
  await expense.save();

  await reconcileSettlements(expense.tripId.toString());

  res.json({ expense: serializeExpense(expense) });
});

export const deleteExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await Expense.findById(req.params.expenseId);
  if (!expense) throw new NotFoundError('Expense not found.');

  await assertCanModify(expense, req);

  const tripId = expense.tripId.toString();
  await expense.deleteOne();
  await reconcileSettlements(tripId);

  res.json({ ok: true });
});

function serializeExpense(expense: InstanceType<typeof Expense>) {
  return {
    id: expense._id,
    note: expense.note,
    category: expense.category,
    amountPaise: expense.amountPaise,
    splitType: expense.splitType,
    payers: expense.payers.map((p) => ({ memberId: p.memberId, amountPaise: p.amountPaise })),
    participants: expense.participants.map((p) => ({
      memberId: p.memberId,
      amountPaise: p.amountPaise,
    })),
    createdBy: expense.createdBy,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}
