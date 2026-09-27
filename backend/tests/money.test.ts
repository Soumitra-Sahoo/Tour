import { rupeesToPaise, paiseToRupeesString, formatINR, MoneyError } from '../src/services/money';

describe('rupeesToPaise', () => {
  it('converts a whole rupee amount', () => {
    expect(rupeesToPaise('1000')).toBe(100000);
  });

  it('converts a 2-decimal amount', () => {
    expect(rupeesToPaise('333.34')).toBe(33334);
  });

  it('converts a 1-decimal amount', () => {
    expect(rupeesToPaise('50.5')).toBe(5050);
  });

  it('converts the smallest unit', () => {
    expect(rupeesToPaise('0.01', true)).toBe(1);
  });

  it('rejects zero by default', () => {
    expect(() => rupeesToPaise('0')).toThrow(MoneyError);
  });

  it('allows zero when explicitly permitted', () => {
    expect(rupeesToPaise('0', true)).toBe(0);
  });

  it('rejects a negative amount', () => {
    expect(() => rupeesToPaise('-50')).toThrow(MoneyError);
  });

  it('rejects more than 2 decimal places', () => {
    expect(() => rupeesToPaise('100.999')).toThrow(MoneyError);
  });

  it('rejects non-numeric input', () => {
    expect(() => rupeesToPaise('abc')).toThrow(MoneyError);
  });

  it('rejects an empty string', () => {
    expect(() => rupeesToPaise('')).toThrow(MoneyError);
  });
});

describe('paiseToRupeesString', () => {
  it('formats exactly 2 decimal places', () => {
    expect(paiseToRupeesString(100000)).toBe('1000.00');
    expect(paiseToRupeesString(33334)).toBe('333.34');
    expect(paiseToRupeesString(1)).toBe('0.01');
  });

  it('formats negative values', () => {
    expect(paiseToRupeesString(-70000)).toBe('-700.00');
  });
});

describe('formatINR', () => {
  it('formats with thousands separators and the rupee symbol', () => {
    expect(formatINR(2540000)).toBe('₹25,400.00');
    expect(formatINR(100000)).toBe('₹1,000.00');
  });

  it('formats negative values with a leading minus outside the symbol', () => {
    expect(formatINR(-70000)).toBe('-₹700.00');
  });
});
