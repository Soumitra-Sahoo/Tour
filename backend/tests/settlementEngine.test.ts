import { computeSettlements } from '../src/services/settlementEngine';
import { MoneyError } from '../src/services/money';

describe('computeSettlements', () => {
  it('produces exact payer -> receiver transactions for a simple 3-person case', () => {
    const result = computeSettlements([
      { memberId: 'soumitra', netBalancePaise: 100000 },
      { memberId: 'pabitra', netBalancePaise: -60000 },
      { memberId: 'rahul', netBalancePaise: -40000 },
    ]);

    expect(result).toEqual(
      expect.arrayContaining([
        { fromMemberId: 'pabitra', toMemberId: 'soumitra', amountPaise: 60000 },
        { fromMemberId: 'rahul', toMemberId: 'soumitra', amountPaise: 40000 },
      ]),
    );
    expect(result).toHaveLength(2);
  });

  it('minimizes transaction count for a multi-creditor multi-debtor case', () => {
    // Net: A +150, B +50, C -100, D -100
    const result = computeSettlements([
      { memberId: 'A', netBalancePaise: 15000 },
      { memberId: 'B', netBalancePaise: 5000 },
      { memberId: 'C', netBalancePaise: -10000 },
      { memberId: 'D', netBalancePaise: -10000 },
    ]);

    // Optimal minimum is 3 transactions for 4 non-zero balances with 2 creditors/2 debtors here
    expect(result.length).toBeLessThanOrEqual(3);
    const totalTransferred = result.reduce((sum, t) => sum + t.amountPaise, 0);
    expect(totalTransferred).toBe(20000);
  });

  it('produces no transactions when everyone is already settled', () => {
    const result = computeSettlements([
      { memberId: 'a', netBalancePaise: 0 },
      { memberId: 'b', netBalancePaise: 0 },
    ]);
    expect(result).toEqual([]);
  });

  it('throws if balances do not sum to zero (inconsistent ledger)', () => {
    expect(() =>
      computeSettlements([
        { memberId: 'a', netBalancePaise: 100 },
        { memberId: 'b', netBalancePaise: -50 },
      ]),
    ).toThrow(MoneyError);
  });

  it('every rupee owed is accounted for by exactly matching receivable', () => {
    const balances = [
      { memberId: 'soumitra', netBalancePaise: 70000 },
      { memberId: 'pabitra', netBalancePaise: -42000 },
      { memberId: 'rahul', netBalancePaise: -68000 },
      { memberId: 'amit', netBalancePaise: 15000 },
      { memberId: 'sayan', netBalancePaise: 25000 },
    ];
    const result = computeSettlements(balances);
    const totalOwed = result.reduce((s, t) => s + t.amountPaise, 0);
    const totalReceivable = totalOwed; // by construction, since it's the same transaction list
    expect(totalOwed).toBe(totalReceivable);

    // Verify per-member net effect matches original balances
    const net: Record<string, number> = {};
    for (const b of balances) net[b.memberId] = 0;
    for (const t of result) {
      net[t.fromMemberId] -= t.amountPaise;
      net[t.toMemberId] += t.amountPaise;
    }
    for (const b of balances) {
      expect(net[b.memberId]).toBe(b.netBalancePaise);
    }
  });
});
