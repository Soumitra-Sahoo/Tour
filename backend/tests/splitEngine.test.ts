import {
  computeEqualSplit,
  validateCustomSplit,
  validatePayers,
} from '../src/services/splitEngine';
import { MoneyError } from '../src/services/money';
import { sumPaise } from '../src/services/money';

describe('computeEqualSplit', () => {
  it('splits 1000 rupees (100000 paise) across 3 participants exactly', () => {
    const result = computeEqualSplit(100000, ['a', 'b', 'c'], null);
    const total = sumPaise(result.map((r) => r.amountPaise));
    expect(total).toBe(100000);
    const amounts = result.map((r) => r.amountPaise).sort((a, b) => a - b);
    expect(amounts).toEqual([33333, 33333, 33334]);
  });

  it('gives the rounding remainder to the owner when the owner participates', () => {
    const result = computeEqualSplit(100000, ['pabitra', 'soumitra', 'rahul'], 'soumitra');
    const bySoumitra = result.find((r) => r.memberId === 'soumitra')!;
    const byPabitra = result.find((r) => r.memberId === 'pabitra')!;
    const byRahul = result.find((r) => r.memberId === 'rahul')!;
    expect(bySoumitra.amountPaise).toBe(33334);
    expect(byPabitra.amountPaise).toBe(33333);
    expect(byRahul.amountPaise).toBe(33333);
    expect(sumPaise(result.map((r) => r.amountPaise))).toBe(100000);
  });

  it('gives the rounding remainder to the first selected participant when the owner is not participating', () => {
    const result = computeEqualSplit(100000, ['pabitra', 'rahul', 'amit'], 'soumitra');
    const byPabitra = result.find((r) => r.memberId === 'pabitra')!;
    const byRahul = result.find((r) => r.memberId === 'rahul')!;
    const byAmit = result.find((r) => r.memberId === 'amit')!;
    expect(byPabitra.amountPaise).toBe(33334);
    expect(byRahul.amountPaise).toBe(33333);
    expect(byAmit.amountPaise).toBe(33333);
  });

  it('splits evenly with no remainder', () => {
    const result = computeEqualSplit(90000, ['a', 'b', 'c'], null);
    expect(result.every((r) => r.amountPaise === 30000)).toBe(true);
  });

  it('rejects fewer than 2 participants', () => {
    expect(() => computeEqualSplit(10000, ['a'], null)).toThrow(MoneyError);
  });

  it('rejects a duplicate participant', () => {
    expect(() => computeEqualSplit(10000, ['a', 'a'], null)).toThrow(MoneyError);
  });

  it('rejects a zero amount', () => {
    expect(() => computeEqualSplit(0, ['a', 'b'], null)).toThrow(MoneyError);
  });

  it('rejects a negative amount', () => {
    expect(() => computeEqualSplit(-100, ['a', 'b'], null)).toThrow(MoneyError);
  });
});

describe('validateCustomSplit', () => {
  it('accepts a custom split that sums exactly to the total', () => {
    const shares = [
      { memberId: 'soumitra', amountPaise: 30000 },
      { memberId: 'pabitra', amountPaise: 20000 },
      { memberId: 'rahul', amountPaise: 20000 },
      { memberId: 'amit', amountPaise: 30000 },
    ];
    expect(validateCustomSplit(100000, shares)).toEqual(shares);
  });

  it('rejects a custom split that does not sum to the total', () => {
    const shares = [
      { memberId: 'a', amountPaise: 30000 },
      { memberId: 'b', amountPaise: 20000 },
    ];
    expect(() => validateCustomSplit(100000, shares)).toThrow(MoneyError);
  });

  it('rejects fewer than 2 participants', () => {
    expect(() => validateCustomSplit(100, [{ memberId: 'a', amountPaise: 100 }])).toThrow(
      MoneyError,
    );
  });

  it('rejects a duplicate participant', () => {
    const shares = [
      { memberId: 'a', amountPaise: 50 },
      { memberId: 'a', amountPaise: 50 },
    ];
    expect(() => validateCustomSplit(100, shares)).toThrow(MoneyError);
  });

  it('rejects a negative share', () => {
    const shares = [
      { memberId: 'a', amountPaise: -50 },
      { memberId: 'b', amountPaise: 150 },
    ];
    expect(() => validateCustomSplit(100, shares)).toThrow(MoneyError);
  });
});

describe('validatePayers', () => {
  it('accepts multiple payers summing exactly to the total', () => {
    const payers = [
      { memberId: 'soumitra', amountPaise: 300000 },
      { memberId: 'pabitra', amountPaise: 200000 },
    ];
    expect(validatePayers(500000, payers)).toEqual(payers);
  });

  it('accepts a single payer', () => {
    const payers = [{ memberId: 'pabitra', amountPaise: 100000 }];
    expect(validatePayers(100000, payers)).toEqual(payers);
  });

  it('rejects payer amounts that do not sum to the total', () => {
    const payers = [
      { memberId: 'a', amountPaise: 100 },
      { memberId: 'b', amountPaise: 100 },
    ];
    expect(() => validatePayers(300, payers)).toThrow(MoneyError);
  });

  it('rejects a zero-amount payer', () => {
    const payers = [{ memberId: 'a', amountPaise: 0 }];
    expect(() => validatePayers(0, payers, )).toThrow(MoneyError);
  });

  it('rejects a duplicate payer', () => {
    const payers = [
      { memberId: 'a', amountPaise: 50 },
      { memberId: 'a', amountPaise: 50 },
    ];
    expect(() => validatePayers(100, payers)).toThrow(MoneyError);
  });

  it('rejects no payers', () => {
    expect(() => validatePayers(100, [])).toThrow(MoneyError);
  });
});
