import { MoneyError, sumPaise } from './money';

export interface MemberBalance {
  memberId: string;
  netBalancePaise: number; // positive = should receive, negative = owes
}

export interface SettlementTransaction {
  fromMemberId: string;
  toMemberId: string;
  amountPaise: number;
}

/**
 * Given net balances for every member, compute an optimized (minimal
 * transaction count) set of payer -> receiver transactions that settles
 * the group.
 *
 * Uses a greedy "largest debtor pays largest creditor" strategy, which is
 * optimal enough for small friend-group trips and deterministic given a
 * stable input order (ties broken by original member order).
 */
export function computeSettlements(balances: MemberBalance[]): SettlementTransaction[] {
  const total = sumPaise(balances.map((b) => b.netBalancePaise));
  if (total !== 0) {
    throw new MoneyError(
      'Internal error: member balances do not sum to zero. Balances are inconsistent.',
    );
  }

  // Preserve original order for deterministic tie-breaking.
  const creditors = balances
    .map((b, index) => ({ ...b, index }))
    .filter((b) => b.netBalancePaise > 0)
    .sort((a, b) => b.netBalancePaise - a.netBalancePaise || a.index - b.index);

  const debtors = balances
    .map((b, index) => ({ ...b, index }))
    .filter((b) => b.netBalancePaise < 0)
    .sort((a, b) => a.netBalancePaise - b.netBalancePaise || a.index - b.index);

  const transactions: SettlementTransaction[] = [];

  let ci = 0;
  let di = 0;

  // Work on mutable copies of the remaining amounts.
  const creditorRemaining = creditors.map((c) => c.netBalancePaise);
  const debtorRemaining = debtors.map((d) => -d.netBalancePaise); // store as positive owed amount

  while (ci < creditors.length && di < debtors.length) {
    const creditAmount = creditorRemaining[ci];
    const debtAmount = debtorRemaining[di];

    if (creditAmount === 0) {
      ci += 1;
      continue;
    }
    if (debtAmount === 0) {
      di += 1;
      continue;
    }

    const settleAmount = Math.min(creditAmount, debtAmount);

    transactions.push({
      fromMemberId: debtors[di].memberId,
      toMemberId: creditors[ci].memberId,
      amountPaise: settleAmount,
    });

    creditorRemaining[ci] -= settleAmount;
    debtorRemaining[di] -= settleAmount;

    if (creditorRemaining[ci] === 0) ci += 1;
    if (debtorRemaining[di] === 0) di += 1;
  }

  return transactions;
}
