import { Link, useParams } from 'react-router-dom';
import { Expense, Member } from '../../types';
import { formatINR, formatDate } from '../../utils/money';
import { categoryIcon } from '../../utils/category';

interface ExpenseCardProps {
  expense: Expense;
  membersById: Record<string, Member>;
}

export function ExpenseCard({ expense, membersById }: ExpenseCardProps) {
  const { shareToken } = useParams();
  const payerNames = expense.payers.map((p) => membersById[p.memberId]?.name || '—').join(', ');

  return (
    <Link
      to={`/trip/${shareToken}/expenses/${expense.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card active:bg-mist-100/40"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mist-100 text-xl">
        {categoryIcon(expense.category)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-pine-900">{expense.note || expense.category}</p>
        <p className="truncate text-sm text-ink-600">
          Paid by {payerNames} · {expense.participants.length} people
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-display font-semibold text-pine-900">{formatINR(expense.amountPaise)}</p>
        <p className="text-xs text-ink-400">{formatDate(expense.createdAt)}</p>
      </div>
    </Link>
  );
}
