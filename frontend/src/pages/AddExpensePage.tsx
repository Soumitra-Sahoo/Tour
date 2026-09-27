import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { listMembers, listCategories } from '../api/member';
import { createExpense } from '../api/expense';
import { Member, Category } from '../types';
import { Spinner } from '../components/common/Spinner';
import { ExpenseForm, ExpenseFormValue } from '../components/expense/ExpenseForm';
import { ConfirmExpenseModal } from '../components/expense/ConfirmExpenseModal';
import { ApiError } from '../api/client';
import { generateIdempotencyKey } from '../utils/money';

export function AddExpensePage() {
  const { shareToken } = useParams();
  const navigate = useNavigate();
  const { trip, member } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingValue, setPendingValue] = useState<ExpenseFormValue | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [idempotencyKey] = useState(generateIdempotencyKey());

  useEffect(() => {
    if (!trip) return;
    Promise.all([listMembers(trip.id), listCategories(trip.id)])
      .then(([m, c]) => {
        setMembers(m.members);
        setCategories(c.categories);
      })
      .finally(() => setLoading(false));
  }, [trip]);

  if (loading || !trip || !member) return <Spinner label="Loading…" />;

  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));

  async function handleConfirm() {
    if (!pendingValue || !trip) return;
    setSubmitting(true);
    setError(null);
    try {
      await createExpense(trip.id, {
        amount: pendingValue.amount,
        note: pendingValue.note || undefined,
        category: pendingValue.category,
        payers: pendingValue.payers,
        participantIds: pendingValue.participantIds,
        splitType: pendingValue.splitType,
        customShares: pendingValue.splitType === 'custom' ? pendingValue.customShares : undefined,
        idempotencyKey,
      });
      navigate(`/trip/${shareToken}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setPendingValue(null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="mb-4 font-display text-xl font-semibold text-pine-900">Add Expense</p>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <ExpenseForm
        members={members}
        categories={categories}
        currentMemberId={member.id}
        onSubmit={setPendingValue}
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
