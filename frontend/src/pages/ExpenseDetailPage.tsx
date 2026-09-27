import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { getExpense, deleteExpense } from '../api/expense';
import { listMembers } from '../api/member';
import { Expense, Member } from '../types';
import { Spinner } from '../components/common/Spinner';
import { ExpenseDetail } from '../components/expense/ExpenseDetail';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { ApiError } from '../api/client';

export function ExpenseDetailPage() {
  const { shareToken, expenseId } = useParams();
  const navigate = useNavigate();
  const { trip, member } = useSession();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!trip || !expenseId) return;
    Promise.all([getExpense(expenseId), listMembers(trip.id)])
      .then(([e, m]) => {
        setExpense(e.expense);
        setMembers(m.members);
      })
      .finally(() => setLoading(false));
  }, [trip, expenseId]);

  if (loading || !trip || !member || !expense) return <Spinner label="Loading expense…" />;

  const membersById = Object.fromEntries(members.map((m) => [m.id, m]));
  const canModify =
    trip.status === 'active' && (member.isOwner || member.id === expense.createdBy);

  async function handleDelete() {
    if (!expenseId) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteExpense(expenseId);
      navigate(`/trip/${shareToken}/expenses`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
      <ExpenseDetail
        expense={expense}
        membersById={membersById}
        canModify={canModify}
        onEdit={() => navigate(`/trip/${shareToken}/expenses/${expenseId}/edit`)}
        onDelete={() => setConfirmDelete(true)}
      />

      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this expense?">
        <p className="text-sm text-ink-600">This will recalculate everyone's balances.</p>
        <div className="mt-5 flex gap-3">
          <Button variant="ghost" fullWidth onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" fullWidth onClick={handleDelete} loading={deleting}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
