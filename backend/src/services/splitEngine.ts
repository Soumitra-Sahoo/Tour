import { MoneyError, sumPaise } from './money';

export interface ShareResult {
  memberId: string;
  amountPaise: number;
}

export interface PayerInput {
  memberId: string;
  amountPaise: number;
}

/**
 * Compute an equal split of `totalPaise` across `participantIds`, in paise,
 * such that the shares always sum EXACTLY to totalPaise.
 *
 * Rounding rule:
 *  - If `ownerId` is one of the participants, the owner receives the
 *    leftover paise from rounding.
 *  - Otherwise, the first participant in `participantIds` (i.e. the order
 *    the caller/UI selected them in) receives the leftover paise.
 */
export function computeEqualSplit(
  totalPaise: number,
  participantIds: string[],
  ownerId: string | null,
): ShareResult[] {
  if (!Number.isInteger(totalPaise) || totalPaise <= 0) {
    throw new MoneyError('Expense amount must be a positive amount.');
  }

  const uniqueIds = new Set(participantIds);
  if (uniqueIds.size !== participantIds.length) {
    throw new MoneyError('The same participant was selected more than once.');
  }
  if (participantIds.length < 2) {
    throw new MoneyError('An expense must have at least 2 participants.');
  }

  const n = participantIds.length;
  const base = Math.floor(totalPaise / n);
  const remainder = totalPaise - base * n;

  const shares: Record<string, number> = {};
  for (const id of participantIds) {
    shares[id] = base;
  }

  // Decide who receives the remainder paise.
  const remainderRecipient =
    ownerId && participantIds.includes(ownerId) ? ownerId : participantIds[0];

  shares[remainderRecipient] += remainder;

  const result = participantIds.map((memberId) => ({ memberId, amountPaise: shares[memberId] }));

  // Defensive invariant check - must always sum exactly to totalPaise.
  const total = sumPaise(result.map((r) => r.amountPaise));
  if (total !== totalPaise) {
    throw new MoneyError('Internal error: split shares do not sum to the expense total.');
  }

  return result;
}

/**
 * Validate a custom split: every participant must have a specified
 * non-negative paise amount, and the shares must sum exactly to the
 * expense total.
 */
export function validateCustomSplit(
  totalPaise: number,
  shares: ShareResult[],
): ShareResult[] {
  if (shares.length < 2) {
    throw new MoneyError('An expense must have at least 2 participants.');
  }

  const ids = shares.map((s) => s.memberId);
  if (new Set(ids).size !== ids.length) {
    throw new MoneyError('The same participant was selected more than once.');
  }

  for (const s of shares) {
    if (!Number.isInteger(s.amountPaise) || s.amountPaise < 0) {
      throw new MoneyError('Each participant amount must be a valid, non-negative amount.');
    }
  }

  const total = sumPaise(shares.map((s) => s.amountPaise));
  if (total !== totalPaise) {
    throw new MoneyError(
      `The participant amounts must equal the expense total exactly.`,
    );
  }

  return shares;
}

/**
 * Validate payer amounts: every payer must have a positive paise amount,
 * and they must sum exactly to the expense total.
 */
export function validatePayers(totalPaise: number, payers: PayerInput[]): PayerInput[] {
  if (payers.length < 1) {
    throw new MoneyError('An expense must have at least one payer.');
  }

  const ids = payers.map((p) => p.memberId);
  if (new Set(ids).size !== ids.length) {
    throw new MoneyError('The same payer was selected more than once.');
  }

  for (const p of payers) {
    if (!Number.isInteger(p.amountPaise) || p.amountPaise <= 0) {
      throw new MoneyError('Each payer amount must be a positive amount.');
    }
  }

  const total = sumPaise(payers.map((p) => p.amountPaise));
  if (total !== totalPaise) {
    throw new MoneyError('The payer amounts must equal the expense total exactly.');
  }

  return payers;
}
