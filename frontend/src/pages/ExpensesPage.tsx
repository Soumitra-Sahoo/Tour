import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { listExpenses } from '../api/expense';
import { listMembers } from '../api/member';
import { Expense, Member } from '../types';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { ExpenseCard } from '../components/expense/ExpenseCard';

export function ExpensesPage() {
  const { shareToken } = useParams();
  const { trip } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trip) return;
    setLoading(true);
    Promise.all([listExpenses(trip.id), listMembers(trip.id)])
      .then(([e, m]) => {
        setExpenses(e.expenses);
        setMembers(m.members);
      })
      .finally(() => setLoading(false));
  }, [trip]);

  if (loading || !trip) return <Spinner label="Loading expenses…" />;

  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));
  const categories = Array.from(new Set(expenses.map((e) => e.category)));
  const filtered =
    categoryFilter === 'all' ? expenses : expenses.filter((e) => e.category === categoryFilter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-xl font-semibold text-pine-900">Expenses</p>
        {trip.status === 'active' ? (
          <Link to={`/trip/${shareToken}/add-expense`}>
            <Button>+ Add</Button>
          </Link>
        ) : null}
      </div>

      {categories.length > 0 ? (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {['all', ...categories].map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium capitalize ${
                categoryFilter === c ? 'bg-pine-700 text-white' : 'bg-white text-ink-600 shadow-card'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState title="No expenses yet." description="Add the first expense for your Darjeeling trip." />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((e) => (
            <ExpenseCard key={e.id} expense={e} membersById={membersById} />
          ))}
        </div>
      )}
    </div>
  );
}
