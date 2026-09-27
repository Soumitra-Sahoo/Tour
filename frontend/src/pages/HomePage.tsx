import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getBalances, getSummary } from '../api/settlement';
import { listExpenses } from '../api/expense';
import { listMembers } from '../api/member';
import { MemberBalance, Expense, Member, TripSummary } from '../types';
import { formatINR } from '../utils/money';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { ExpenseCard } from '../components/expense/ExpenseCard';

export function HomePage() {
  const { shareToken } = useParams();
  const { trip, member } = useSession();
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [summary, setSummary] = useState<TripSummary | null>(null);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trip) return;
    setLoading(true);
    Promise.all([getBalances(trip.id), getSummary(trip.id), listExpenses(trip.id), listMembers(trip.id)])
      .then(([b, s, e, m]) => {
        setBalances(b.balances);
        setSummary(s);
        setRecentExpenses(e.expenses.slice(0, 5));
        setMembers(m.members);
      })
      .finally(() => setLoading(false));
  }, [trip]);

  if (loading || !trip || !member) return <Spinner label="Loading your trip…" />;

  const myBalance = balances.find((b) => b.memberId === member.id);
  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-sm font-medium text-ink-600">Total Trip Expense</p>
        <p className="font-display text-3xl font-bold text-pine-900">
          {formatINR(summary?.totalExpensePaise ?? 0)}
        </p>
      </div>

      {myBalance ? (
        <div className="rounded-2xl bg-white p-4 shadow-card">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-ink-600">You Paid</p>
              <p className="font-display text-lg font-semibold text-pine-900">
                {formatINR(myBalance.totalPaidPaise)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-600">Your Share</p>
              <p className="font-display text-lg font-semibold text-pine-900">
                {formatINR(myBalance.totalSharePaise)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-600">Your Advance</p>
              <p className="font-display text-lg font-semibold text-mist-600">
                {formatINR(myBalance.totalAdvancePaise)}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-mist-100 pt-4">
            <p className="text-xs font-medium text-ink-600">Your Balance</p>
            <p
              className={`font-display text-2xl font-bold ${
                myBalance.netBalancePaise >= 0 ? 'text-mist-600' : 'text-sunrise-600'
              }`}
            >
              {myBalance.netBalancePaise >= 0 ? '+' : ''}
              {formatINR(myBalance.netBalancePaise)}
            </p>
            <p className="text-sm text-ink-600">
              {myBalance.netBalancePaise > 0
                ? `You should receive ${formatINR(myBalance.netBalancePaise)}`
                : myBalance.netBalancePaise < 0
                  ? `You need to pay ${formatINR(-myBalance.netBalancePaise)}`
                  : "You're all settled up"}
            </p>
          </div>
        </div>
      ) : null}

      {trip.status === 'active' ? (
        <Link to={`/trip/${shareToken}/add-expense`}>
          <Button fullWidth>+ Add Expense</Button>
        </Link>
      ) : null}

      <div>
        <p className="mb-2 font-display text-lg font-semibold text-pine-900">Members</p>
        <div className="flex flex-col gap-2">
          {balances.map((b) => (
            <div key={b.memberId} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-card">
              <span className="text-pine-900">{b.name}</span>
              <span
                className={`font-semibold ${
                  b.netBalancePaise > 0
                    ? 'text-mist-600'
                    : b.netBalancePaise < 0
                      ? 'text-sunrise-600'
                      : 'text-ink-400'
                }`}
              >
                {b.netBalancePaise > 0 ? '+' : ''}
                {formatINR(b.netBalancePaise)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 font-display text-lg font-semibold text-pine-900">Recent Expenses</p>
        {recentExpenses.length === 0 ? (
          <EmptyState
            title="No expenses yet."
            description="Add the first expense for your Darjeeling trip."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {recentExpenses.map((e) => (
              <ExpenseCard key={e.id} expense={e} membersById={membersById} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
