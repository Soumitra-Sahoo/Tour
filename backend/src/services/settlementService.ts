import { Types, ClientSession } from 'mongoose';
import { Member } from '../models/Member';
import { Expense } from '../models/Expense';
import { Advance } from '../models/Advance';
import { Settlement, ISettlement } from '../models/Settlement';
import { computeMemberBalances, MemberBalanceDetail } from './balanceService';
import { computeSettlements } from './settlementEngine';

/**
 * Recalculates the trip's balances from the expense ledger and re-derives
 * the set of PENDING settlement transactions needed to settle the group.
 *
 * Settlements that are already marked `paid` are historical records and
 * are never modified (Section 30 of the spec: settling up never touches
 * the original expenses or past settlement history). Only the `pending`
 * settlement set is recomputed - old pending ones are replaced with a
 * freshly optimized set based on the current outstanding balances.
 */
export async function reconcileSettlements(
  tripId: string,
  session?: ClientSession,
): Promise<{ balances: MemberBalanceDetail[]; settlements: ISettlement[] }> {
  const members = await Member.find({ tripId }).session(session ?? null);
  const memberIds = members.map((m) => m._id.toString());

  const expenses = await Expense.find({ tripId }).session(session ?? null);
  const advances = await Advance.find({ tripId }).session(session ?? null);
  const trip = await (await import('../models/Trip')).Trip.findById(tripId).select('ownerId treasurerId').session(session ?? null);
  const balances = computeMemberBalances(
    memberIds,
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

  const paidSettlements = await Settlement.find({ tripId, status: 'paid' }).session(session ?? null);

  // Net effect of already-paid settlements, so we don't re-suggest paid debts.
  const paidEffect: Record<string, number> = {};
  for (const id of memberIds) paidEffect[id] = 0;
  for (const s of paidSettlements) {
    const from = s.fromMemberId.toString();
    const to = s.toMemberId.toString();
    if (from in paidEffect) paidEffect[from] += s.amountPaise; // debtor's debt shrinks (moves toward 0)
    if (to in paidEffect) paidEffect[to] -= s.amountPaise; // creditor's receivable shrinks
  }

  const outstanding = balances.map((b) => ({
    memberId: b.memberId,
    netBalancePaise: b.netBalancePaise + paidEffect[b.memberId],
  }));

  const pendingTransactions = computeSettlements(outstanding);

  // Replace the old pending set with the freshly computed one.
  await Settlement.deleteMany({ tripId, status: 'pending' }).session(session ?? null);

  const newPending =
    pendingTransactions.length > 0
      ? await Settlement.insertMany(
          pendingTransactions.map((t) => ({
            tripId: new Types.ObjectId(tripId),
            fromMemberId: new Types.ObjectId(t.fromMemberId),
            toMemberId: new Types.ObjectId(t.toMemberId),
            amountPaise: t.amountPaise,
            status: 'pending' as const,
          })),
          { session: session ?? undefined },
        )
      : [];

  return {
    balances,
    settlements: [...paidSettlements, ...newPending],
  };
}
