import { MoneyError, sumPaise } from './money';

export interface ExpenseLike {
  payers: { memberId: string; amountPaise: number }[];
  participants: { memberId: string; amountPaise: number }[];
}

export interface MemberBalanceDetail {
  memberId: string;
  totalPaidPaise: number;
  totalSharePaise: number;
  totalAdvancePaise: number;
  netBalancePaise: number; // personal paid + advance - share, with treasurer carrying the pooled advance
  expensesPaidCount: number;
}

/**
 * Advances are contributions to the common trip fund. They are not expenses.
 * The trip treasurer holds that pooled cash, so the total advance is removed
 * from the treasurer's net position. This makes the final settlement equivalent
 * to "individual expense - advance" while still correctly crediting people
 * who personally paid expenses.
 */
export function computeMemberBalances(
  memberIds: string[],
  expenses: ExpenseLike[],
  advances: { memberId: string; amountPaise: number }[] = [],
  treasurerId: string | null = null,
): MemberBalanceDetail[] {
  const paid: Record<string, number> = {};
  const share: Record<string, number> = {};
  const advance: Record<string, number> = {};
  const paidCount: Record<string, number> = {};

  for (const id of memberIds) {
    paid[id] = 0;
    share[id] = 0;
    advance[id] = 0;
    paidCount[id] = 0;
  }

  for (const expense of expenses) {
    for (const payer of expense.payers) {
      if (!(payer.memberId in paid)) throw new MoneyError('Expense references a member not in this trip.');
      paid[payer.memberId] += payer.amountPaise;
      paidCount[payer.memberId] += 1;
    }
    for (const participant of expense.participants) {
      if (!(participant.memberId in share)) throw new MoneyError('Expense references a member not in this trip.');
      share[participant.memberId] += participant.amountPaise;
    }
  }

  for (const item of advances) {
    if (!(item.memberId in advance)) throw new MoneyError('Advance references a member not in this trip.');
    advance[item.memberId] += item.amountPaise;
  }

  const totalAdvance = sumPaise(Object.values(advance));
  const details = memberIds.map((memberId) => {
    let net = paid[memberId] + advance[memberId] - share[memberId];
    if (treasurerId === memberId) net -= totalAdvance;
    return {
      memberId,
      totalPaidPaise: paid[memberId],
      totalSharePaise: share[memberId],
      totalAdvancePaise: advance[memberId],
      netBalancePaise: net,
      expensesPaidCount: paidCount[memberId],
    };
  });

  if (sumPaise(details.map((d) => d.netBalancePaise)) !== 0) {
    throw new MoneyError('Internal error: trip balances do not sum to zero.');
  }

  return details;
}
