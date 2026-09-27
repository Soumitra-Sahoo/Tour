import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getBalances } from '../api/settlement';
import { MemberBalance } from '../types';
import { Spinner } from '../components/common/Spinner';
import { formatINR } from '../utils/money';

export function MemberDetailPage() {
  const { memberId } = useParams();
  const { trip } = useSession();
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trip) return;
    getBalances(trip.id)
      .then((r) => setBalances(r.balances))
      .finally(() => setLoading(false));
  }, [trip]);

  if (loading || !trip) return <Spinner label="Loading…" />;

  const balance = balances.find((b) => b.memberId === memberId);
  if (!balance) return <p className="text-center text-ink-600">Member not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <p className="font-display text-2xl font-semibold text-pine-900">
          {balance.isOwner ? '👑 ' : ''}
          {balance.name}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-ink-600">Total Paid</p>
            <p className="font-display text-lg font-semibold text-pine-900">
              {formatINR(balance.totalPaidPaise)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-600">Total Share</p>
            <p className="font-display text-lg font-semibold text-pine-900">
              {formatINR(balance.totalSharePaise)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-600">Advance</p>
            <p className="font-display text-lg font-semibold text-mist-600">{formatINR(balance.totalAdvancePaise)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-600">Balance</p>
            <p
              className={`font-display text-lg font-semibold ${
                balance.netBalancePaise >= 0 ? 'text-mist-600' : 'text-sunrise-600'
              }`}
            >
              {balance.netBalancePaise >= 0 ? '+' : ''}
              {formatINR(balance.netBalancePaise)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-600">Expenses Paid</p>
            <p className="font-display text-lg font-semibold text-pine-900">{balance.expensesPaidCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
