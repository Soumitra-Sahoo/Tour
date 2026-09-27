import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getExpense, updateExpense } from '../api/expense';
import { listMembers, listCategories } from '../api/member';
import { Expense, Member, Category } from '../types';
import { Spinner } from '../components/common/Spinner';
import { ExpenseForm, ExpenseFormValue } from '../components/expense/ExpenseForm';
import { ConfirmExpenseModal } from '../components/expense/ConfirmExpenseModal';
import { ApiError } from '../api/client';

export function EditExpensePage() {
  const { shareToken, expenseId } = useParams();
  const navigate = useNavigate();
  const { trip, member } = useSession();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingValue, setPendingValue] = useState<ExpenseFormValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trip || !expenseId) return;
    Promise.all([getExpense(expenseId), listMembers(trip.id), listCategories(trip.id)])
      .then(([e, m, c]) => {
        setExpense(e.expense);
        setMembers(m.members);
        setCategories(c.categories);
      })
      .finally(() => setLoading(false));
  }, [trip, expenseId]);

  if (loading || !trip || !member || !expense) return <Spinner label="Loading…" />;

  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));

  const initialValue: Partial<ExpenseFormValue> = {
    amount: (expense.amountPaise / 100).toFixed(2),
    note: expense.note || '',
    category: expense.category,
    payers: expense.payers.map((p) => ({
      memberId: p.memberId,
      amount: expense.payers.length > 1 ? (p.amountPaise / 100).toFixed(2) : undefined,
    })),
    participantIds: expense.participants.map((p) => p.memberId),
    splitType: expense.splitType,
    customShares:
      expense.splitType === 'custom'
        ? expense.participants.map((p) => ({ memberId: p.memberId, amount: (p.amountPaise / 100).toFixed(2) }))
        : [],
  };

  async function handleConfirm() {
    if (!pendingValue || !expenseId) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateExpense(expenseId, {
        amount: pendingValue.amount,
        note: pendingValue.note || undefined,
        category: pendingValue.category,
        payers: pendingValue.payers,
        participantIds: pendingValue.participantIds,
        splitType: pendingValue.splitType,
        customShares: pendingValue.splitType === 'custom' ? pendingValue.customShares : undefined,
      });
      navigate(`/trip/${shareToken}/expenses/${expenseId}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setPendingValue(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="mb-4 font-display text-xl font-semibold text-pine-900">Edit Expense</p>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <ExpenseForm
        members={members}
        categories={categories}
        currentMemberId={member.id}
        initialValue={initialValue}
        onSubmit={setPendingValue}
        submitLabel="Save Changes"
      />
      <ConfirmExpenseModal
        open={pendingValue !== null}
        onClose={() => setPendingValue(null)}
        onConfirm={handleConfirm}
        value={pendingValue}
        membersById={membersById}
        ownerId={trip.ownerId ?? null}
        submitting={submitting}
      />
    </div>
  );
}
