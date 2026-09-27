import { Request, Response } from 'express';
import { Member } from '../models/Member';
import { Expense } from '../models/Expense';
import { Advance } from '../models/Advance';
import { Trip } from '../models/Trip';
import { computeMemberBalances } from '../services/balanceService';
import { asyncHandler } from '../utils/asyncHandler';
import { sumPaise } from '../services/money';

export const getBalances = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const members = await Member.find({ tripId }).sort({ createdAt: 1 });
  const expenses = await Expense.find({ tripId });
  const advances = await Advance.find({ tripId });
  const trip = await Trip.findById(tripId).select('ownerId treasurerId');

  const balances = computeMemberBalances(
    members.map((m) => m._id.toString()),
    expenses.map((e) => ({
      payers: e.payers.map((p) => ({ memberId: p.memberId.toString(), amountPaise: p.amountPaise })),
      participants: e.participants.map((p) => ({
        memberId: p.memberId.toString(),
        amountPaise: p.amountPaise,
      })),
    })),
    advances.map((a) => ({ memberId: a.memberId.toString(), amountPaise: a.amountPaise })),
    trip?.treasurerId?.toString() ?? trip?.ownerId?.toString() ?? null,
  );

  const byId = Object.fromEntries(balances.map((b) => [b.memberId, b]));

  res.json({
    balances: members.map((m) => ({
      memberId: m._id,
      name: m.name,
      isOwner: m.isOwner,
      totalPaidPaise: byId[m._id.toString()].totalPaidPaise,
      totalSharePaise: byId[m._id.toString()].totalSharePaise,
      totalAdvancePaise: byId[m._id.toString()].totalAdvancePaise,
      netBalancePaise: byId[m._id.toString()].netBalancePaise,
      expensesPaidCount: byId[m._id.toString()].expensesPaidCount,
    })),
  });
});

export const getSummary = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const expenses = await Expense.find({ tripId });
  const advances = await Advance.find({ tripId });
  const totalExpensePaise = sumPaise(expenses.map((e) => e.amountPaise));

  res.json({
    totalExpensePaise,
    expenseCount: expenses.length,
    totalAdvancePaise: sumPaise(advances.map((a) => a.amountPaise)),
  });
});
