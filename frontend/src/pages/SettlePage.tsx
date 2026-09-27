import { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { listSettlements, markSettlementPaid } from '../api/settlement';
import { listMembers } from '../api/member';
import { Settlement, Member, MemberBalance } from '../types';
import { getBalances } from '../api/settlement';
import { formatINR } from '../utils/money';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { SettlementCard } from '../components/settle/SettlementCard';
import { ApiError } from '../api/client';

export function SettlePage() {
  const { trip, member } = useSession();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!trip) return;
    const [s, m, b] = await Promise.all([listSettlements(trip.id), listMembers(trip.id), getBalances(trip.id)]);
    setSettlements(s.settlements);
    setMembers(m.members);
    setBalances(b.balances);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]);

  if (loading || !trip || !member) return <Spinner label="Loading settlements…" />;

  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));
  const pending = settlements.filter((s) => s.status === 'pending');
  const paid = settlements.filter((s) => s.status === 'paid');

  async function handleMarkPaid(id: string) {
    setMarkingId(id);
    setError(null);
    try {
      await markSettlementPaid(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="font-display text-xl font-semibold text-pine-900">Settle Up</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="font-display text-lg font-semibold text-pine-900">Final Breakdown</p>
        <p className="mb-3 text-xs text-ink-600">Your advance is already counted toward your trip cost. Final balance also includes expenses you personally paid.</p>
        <div className="flex flex-col gap-2">
          {balances.map((b) => (
            <div key={b.memberId} className="rounded-xl bg-mist-50 p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-pine-900">{b.name}</span>
                <span className="font-semibold text-pine-900">{formatINR(b.totalSharePaise)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-ink-600">
                <span>Advance: {formatINR(b.totalAdvancePaise)} · Paid: {formatINR(b.totalPaidPaise)}</span>
                <span className={b.netBalancePaise >= 0 ? 'text-mist-600' : 'text-sunrise-600'}>
                  {b.netBalancePaise >= 0 ? '+' : ''}{formatINR(b.netBalancePaise)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pending.length === 0 ? (
        <EmptyState icon="🎉" title="Everyone is settled up!" />
      ) : (
        <div className="flex flex-col gap-2">
          {pending.map((s) => (
            <SettlementCard
              key={s.id}
              settlement={s}
              membersById={membersById}
              currentMemberId={member.id}
              onMarkPaid={handleMarkPaid}
              marking={markingId === s.id}
            />
          ))}
        </div>
      )}

      {paid.length > 0 ? (
        <div>
          <p className="mb-2 font-display text-lg font-semibold text-pine-900">Settlement History</p>
          <div className="flex flex-col gap-2">
            {paid.map((s) => (
              <SettlementCard key={s.id} settlement={s} membersById={membersById} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
