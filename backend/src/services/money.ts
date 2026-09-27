/**
 * Money handling utilities.
 *
 * ALL accounting math in this application happens in integer paise
 * (1 rupee = 100 paise). We never use floating point for money math.
 * Floating point is only ever touched at the very edge, when a human
 * types a rupee amount into a form (rupeesToPaise) or when we format
 * a paise value for display (paiseToRupeesString).
 */

export class MoneyError extends Error {}

/**
 * Convert a rupee amount (as typed by a user, e.g. "1000" or "333.34")
 * into integer paise. Rejects anything that isn't a clean 2-decimal
 * (or fewer) rupee amount, and rejects non-positive amounts when
 * `allowZero` is false.
 */
export function rupeesToPaise(rupees: number | string, allowZero = false): number {
  const str = typeof rupees === 'number' ? rupees.toString() : rupees.trim();

  if (str === '' || Number.isNaN(Number(str))) {
    throw new MoneyError('Please enter a valid amount.');
  }

  // Reject more than 2 decimal places, scientific notation, etc.
  if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
    throw new MoneyError('Amounts can have at most 2 decimal places.');
  }

  const [wholePart, decimalPart = ''] = str.split('.');
  const paddedDecimal = (decimalPart + '00').slice(0, 2);
  const sign = wholePart.startsWith('-') ? -1 : 1;
  const wholeDigits = wholePart.replace('-', '');

  const paise = sign * (Number(wholeDigits) * 100 + Number(paddedDecimal));

  if (!allowZero && paise <= 0) {
    throw new MoneyError('Please enter an amount.');
  }
  if (paise < 0) {
    throw new MoneyError('Amount cannot be negative.');
  }

  return paise;
}

/** Format integer paise as a rupee string with exactly 2 decimals, e.g. 33334 -> "333.34". */
export function paiseToRupeesString(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new MoneyError('Internal error: paise value must be an integer.');
  }
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  const str = `${whole}.${cents.toString().padStart(2, '0')}`;
  return negative ? `-${str}` : str;
}

/** Format integer paise as a full display string with the rupee symbol and thousands separators, e.g. 100000 -> "₹1,000.00". */
export function formatINR(paise: number): string {
  const negative = paise < 0;
  const abs = Math.abs(paise);
  const whole = Math.floor(abs / 100);
  const cents = abs % 100;
  const wholeStr = whole.toLocaleString('en-IN');
  const str = `₹${wholeStr}.${cents.toString().padStart(2, '0')}`;
  return negative ? `-${str}` : str;
}

export function sumPaise(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}
