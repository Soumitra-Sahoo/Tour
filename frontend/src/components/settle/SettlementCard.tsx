import { Settlement, Member } from '../../types';
import { formatINR, formatDateTime } from '../../utils/money';
import { Button } from '../common/Button';

interface SettlementCardProps {
  settlement: Settlement;
  membersById: Record<string, Member>;
  currentMemberId?: string;
  onMarkPaid?: (id: string) => void;
  marking?: boolean;
}

export function SettlementCard({
  settlement,
  membersById,
  currentMemberId,
  onMarkPaid,
  marking,
}: SettlementCardProps) {
  const from = membersById[settlement.fromMemberId]?.name || '—';
  const to = membersById[settlement.toMemberId]?.name || '—';
  const isPaid = settlement.status === 'paid';
  const canMark =
    !isPaid && onMarkPaid && (currentMemberId === settlement.fromMemberId || currentMemberId === undefined);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-600">
          <span className="font-semibold text-pine-900">{from}</span>
          {isPaid ? ' paid ' : ' → pay '}
          <span className="font-semibold text-pine-900">{to}</span>
        </p>
        <p className="font-display text-xl font-semibold text-pine-900">{formatINR(settlement.amountPaise)}</p>
        {isPaid && settlement.paidAt ? (
          <p className="text-xs text-ink-400">✓ Paid {formatDateTime(settlement.paidAt)}</p>
        ) : null}
      </div>
      {canMark ? (
        <Button variant="secondary" onClick={() => onMarkPaid?.(settlement.id)} loading={marking}>
          Mark as Paid
        </Button>
      ) : isPaid ? (
        <span className="shrink-0 text-2xl" aria-hidden>
          ✓
        </span>
      ) : null}
    </div>
  );
}
