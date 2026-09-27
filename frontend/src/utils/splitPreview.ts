/** Converts a rupee string like "1000" or "333.34" into integer paise. Returns null if invalid. */
export function toPaise(value: string): number | null {
  const str = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(str)) return null;
  const [whole, decimal = ''] = str.split('.');
  const padded = (decimal + '00').slice(0, 2);
  return Number(whole) * 100 + Number(padded);
}

export interface PreviewShare {
  memberId: string;
  amountPaise: number;
}

/**
 * Mirrors the backend's equal-split rounding rule for preview purposes only.
 * The backend recalculates and validates this authoritatively on save.
 */
export function previewEqualSplit(
  totalPaise: number,
  participantIds: string[],
  ownerId: string | null,
): PreviewShare[] {
  const n = participantIds.length;
  if (n === 0) return [];
  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise - base * n;
  const shares: Record<string, number> = {};
  for (const id of participantIds) shares[id] = base;
  const recipient = ownerId && participantIds.includes(ownerId) ? ownerId : participantIds[0];
  shares[recipient] += remainder;
  return participantIds.map((memberId) => ({ memberId, amountPaise: shares[memberId] }));
}
