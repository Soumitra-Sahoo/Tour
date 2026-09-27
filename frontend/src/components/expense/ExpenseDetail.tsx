import { Expense, Member } from '../../types';
import { formatINR, formatDateTime } from '../../utils/money';
import { categoryIcon } from '../../utils/category';
import { Button } from '../common/Button';

interface ExpenseDetailProps {
  expense: Expense;
  membersById: Record<string, Member>;
  canModify: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function ExpenseDetail({ expense, membersById, canModify, onEdit, onDelete }: ExpenseDetailProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 py-2 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mist-100 text-2xl">
          {categoryIcon(expense.category)}
        </span>
        <p className="font-display text-xl font-semibold text-pine-900">{expense.note || expense.category}</p>
        <p className="font-display text-3xl font-semibold text-pine-900">{formatINR(expense.amountPaise)}</p>
        <span className="rounded-full bg-mist-100 px-3 py-1 text-xs font-medium text-mist-600">
          {expense.category}
        </span>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-semibold text-ink-600">Payers</p>
        <div className="flex flex-col gap-1.5">
          {expense.payers.map((p) => (
            <div key={p.memberId} className="flex justify-between text-sm">
              <span className="text-pine-900">{membersById[p.memberId]?.name || '—'}</span>
              <span className="font-medium text-pine-900">{formatINR(p.amountPaise)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="mb-2 text-sm font-semibold text-ink-600">Participants</p>
        <div className="flex flex-col gap-1.5">
          {expense.participants.map((p) => (
            <div key={p.memberId} className="flex justify-between text-sm">
              <span className="text-pine-900">{membersById[p.memberId]?.name || '—'}</span>
              <span className="font-medium text-pine-900">{formatINR(p.amountPaise)}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-ink-400">Created {formatDateTime(expense.createdAt)}</p>

      {canModify ? (
        <div className="flex gap-3">
          <Button variant="ghost" fullWidth onClick={onEdit}>
            Edit
          </Button>
          <Button variant="danger" fullWidth onClick={onDelete}>
            Delete
          </Button>
        </div>
      ) : null}
    </div>
  );
}
