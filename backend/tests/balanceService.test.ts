import { computeMemberBalances } from '../src/services/balanceService';
import { MoneyError } from '../src/services/money';

describe('computeMemberBalances', () => {
  const memberIds = ['soumitra', 'pabitra', 'rahul', 'amit', 'sayan'];

  it('matches the final acceptance test scenario from the spec', () => {
    const expenses = [
      {
        payers: [{ memberId: 'pabitra', amountPaise: 100000 }],
        participants: [
          { memberId: 'pabitra', amountPaise: 33333 },
          { memberId: 'soumitra', amountPaise: 33334 },
          { memberId: 'rahul', amountPaise: 33333 },
        ],
      },
      // Cab ₹600, paid by Rahul, participants Rahul/Pabitra
      {
        payers: [{ memberId: 'rahul', amountPaise: 60000 }],
        participants: [
          { memberId: 'rahul', amountPaise: 30000 },
          { memberId: 'pabitra', amountPaise: 30000 },
        ],
      },
      // Hotel ₹5000, multiple payers Soumitra 3000 / Pabitra 2000, all 5 participate equally
      // 5000/5 = 1000 each exactly, no remainder
      {
        payers: [
          { memberId: 'soumitra', amountPaise: 300000 },
          { memberId: 'pabitra', amountPaise: 200000 },
        ],
        participants: [
          { memberId: 'soumitra', amountPaise: 100000 },
          { memberId: 'pabitra', amountPaise: 100000 },
          { memberId: 'rahul', amountPaise: 100000 },
          { memberId: 'amit', amountPaise: 100000 },
          { memberId: 'sayan', amountPaise: 100000 },
        ],
      },
    ];

    const balances = computeMemberBalances(memberIds, expenses);
    const byId = Object.fromEntries(balances.map((b) => [b.memberId, b]));

    // Soumitra paid 300000 (hotel), share 33334 + 100000 = 133334
    expect(byId.soumitra.totalPaidPaise).toBe(300000);
    expect(byId.soumitra.totalSharePaise).toBe(133334);
    expect(byId.soumitra.netBalancePaise).toBe(166666);

    // Pabitra paid 100000 (dinner) + 200000 (hotel) = 300000
    // share: 33333 (dinner) + 30000 (cab) + 100000 (hotel) = 163333
    expect(byId.pabitra.totalPaidPaise).toBe(300000);
    expect(byId.pabitra.totalSharePaise).toBe(163333);
    expect(byId.pabitra.netBalancePaise).toBe(136667);

    // Rahul paid 60000 (cab), share 33333 (dinner) + 30000 (cab) + 100000 (hotel) = 163333
    expect(byId.rahul.totalPaidPaise).toBe(60000);
    expect(byId.rahul.totalSharePaise).toBe(163333);
    expect(byId.rahul.netBalancePaise).toBe(-103333);

    // Amit paid 0, share 100000
    expect(byId.amit.totalPaidPaise).toBe(0);
    expect(byId.amit.totalSharePaise).toBe(100000);
    expect(byId.amit.netBalancePaise).toBe(-100000);

    // Sayan paid 0, share 100000
    expect(byId.sayan.totalPaidPaise).toBe(0);
    expect(byId.sayan.totalSharePaise).toBe(100000);
    expect(byId.sayan.netBalancePaise).toBe(-100000);

    // Invariant: all net balances sum to zero
    const sum = balances.reduce((s, b) => s + b.netBalancePaise, 0);
    expect(sum).toBe(0);
  });

  it('handles a member who has paid nothing', () => {
    const balances = computeMemberBalances(['a', 'b'], [
      {
        payers: [{ memberId: 'a', amountPaise: 1000 }],
        participants: [
          { memberId: 'a', amountPaise: 500 },
          { memberId: 'b', amountPaise: 500 },
        ],
      },
    ]);
    const b = balances.find((x) => x.memberId === 'b')!;
    expect(b.totalPaidPaise).toBe(0);
    expect(b.totalSharePaise).toBe(500);
    expect(b.netBalancePaise).toBe(-500);
  });

  it('returns zero balances for a trip with zero expenses', () => {
    const balances = computeMemberBalances(memberIds, []);
    expect(balances.every((b) => b.netBalancePaise === 0)).toBe(true);
    expect(balances.every((b) => b.totalPaidPaise === 0)).toBe(true);
    expect(balances.every((b) => b.totalSharePaise === 0)).toBe(true);
  });

  it('throws if an expense references a member outside the trip', () => {
    expect(() =>
      computeMemberBalances(['a'], [
        {
          payers: [{ memberId: 'ghost', amountPaise: 100 }],
          participants: [
            { memberId: 'a', amountPaise: 50 },
            { memberId: 'ghost', amountPaise: 50 },
          ],
        },
      ]),
    ).toThrow(MoneyError);
  });
});

describe('computeMemberBalances with advances', () => {
  it('credits contributors and makes the treasurer carry the pooled advance', () => {
    const balances = computeMemberBalances(
      ['sou', 'pab', 'rah'],
      [{
        payers: [{ memberId: 'pab', amountPaise: 100000 }],
        participants: [
          { memberId: 'sou', amountPaise: 33334 },
          { memberId: 'pab', amountPaise: 33333 },
          { memberId: 'rah', amountPaise: 33333 },
        ],
      }],
      [
        { memberId: 'sou', amountPaise: 200000 },
        { memberId: 'pab', amountPaise: 100000 },
      ],
      'pab',
    );

    const byId = Object.fromEntries(balances.map((b) => [b.memberId, b]));
    expect(byId.sou.totalAdvancePaise).toBe(200000);
    expect(byId.sou.netBalancePaise).toBe(166666);
    expect(byId.pab.totalAdvancePaise).toBe(100000);
    expect(byId.pab.netBalancePaise).toBe(-133333);
    expect(byId.rah.netBalancePaise).toBe(-33333);
    expect(balances.reduce((sum, b) => sum + b.netBalancePaise, 0)).toBe(0);
  });
});
