import { Advance } from '../models/Advance';
import { sumPaise } from './money';

export async function getAdvanceTotals(tripId: string) {
  const advances = await Advance.find({ tripId });
  const byMember: Record<string, number> = {};
  for (const advance of advances) {
    const id = advance.memberId.toString();
    byMember[id] = (byMember[id] ?? 0) + advance.amountPaise;
  }
  return {
    advances,
    byMember,
    totalPaise: sumPaise(advances.map((a) => a.amountPaise)),
  };
}
