import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { listExpenses, deleteExpense } from '../api/expense';
import { listAdvances, updateAdvance, deleteAdvance } from '../api/advance';
import { listMembers } from '../api/member';
import { Expense, Advance, Member } from '../types';
import { Spinner } from '../components/common/Spinner';
import { Modal } from '../components/common/Modal';
import { Field } from '../components/common/Field';
import { Button } from '../components/common/Button';
import { formatINR } from '../utils/money';
import { ApiError } from '../api/client';

export function AdminPage() {
  const { shareToken } = useParams();
  const { trip, member } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingAdvance, setEditingAdvance] = useState<Advance | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');

  const memberNames = useMemo(
    () => Object.fromEntries(members.map((m) => [m.id, m.name])),
    [members],
  );

  async function load() {
    if (!trip) return;
    const [e, a, m] = await Promise.all([
      listExpenses(trip.id),
      listAdvances(trip.id),
      listMembers(trip.id),
    ]);
    setExpenses(e.expenses);
    setAdvances(a.advances);
    setMembers(m.members);
  }

  useEffect(() => {
    if (!member?.isOwner) return;
    setLoading(true);
    load().catch((err) => setError(err instanceof ApiError ? err.message : 'Unable to load admin data.')).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, member?.isOwner]);

  if (!member?.isOwner) {
    return (
      <div className="rounded-3xl bg-white p-6 text-center shadow-card">
        <div className="text-4xl">🔒</div>
        <h1 className="mt-3 font-display text-xl font-semibold text-pine-900">Owner only</h1>
        <p className="mt-1 text-sm text-ink-600">This correction area is available only to the trip owner.</p>
      </div>
    );
  }

  if (loading || !trip) return <Spinner label="Loading admin panel…" />;

  async function removeExpense(id: string) {
    if (!window.confirm('Delete this expense? Everyone’s balances and settlements will be recalculated.')) return;
    setBusyId(id);
    try {
      await deleteExpense(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to delete expense.');
    } finally {
      setBusyId(null);
    }
  }

  async function removeAdvance(id: string) {
    if (!window.confirm('Delete this advance? Everyone’s balances and settlements will be recalculated.')) return;
    setBusyId(id);
    try {
      await deleteAdvance(id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to delete advance.');
    } finally {
      setBusyId(null);
    }
  }

  function openAdvanceEdit(advance: Advance) {
    setEditingAdvance(advance);
    setAdvanceAmount((advance.amountPaise / 100).toFixed(2));
    setAdvanceNote(advance.note ?? '');
  }

  async function saveAdvanceEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAdvance) return;
    setBusyId(editingAdvance.id);
    try {
      await updateAdvance(editingAdvance.id, { amount: advanceAmount, note: advanceNote || undefined });
      setEditingAdvance(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to update advance.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-pine-900 via-pine-800 to-mist-700 p-5 text-white shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">Private owner area</p>
            <h1 className="mt-1 font-display text-2xl font-bold">Admin corrections</h1>
            <p className="mt-1 text-sm text-white/75">Fix a wrong expense or advance without exposing admin controls to the group.</p>
          </div>
          <span className="rounded-2xl bg-white/10 px-3 py-2 text-xl">🛠️</span>
        </div>
      </section>

      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-pine-900">Expenses</h2>
            <p className="text-xs text-ink-600">Edit or delete any incorrect transaction.</p>
          </div>
          <span className="rounded-full bg-mist-100 px-3 py-1 text-xs font-semibold text-pine-700">{expenses.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-pine-900">{expense.note || expense.category}</p>
                  <p className="mt-1 text-xs text-ink-600">{expense.category} · Paid by {expense.payers.map((p) => memberNames[p.memberId] ?? 'Member').join(', ')}</p>
                  <p className="mt-2 font-display text-lg font-bold text-pine-900">{formatINR(expense.amountPaise)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link to={`/trip/${shareToken}/expenses/${expense.id}/edit`} className="rounded-xl bg-mist-100 px-3 py-2 text-xs font-semibold text-pine-800">Edit</Link>
                  <button disabled={busyId === expense.id} onClick={() => removeExpense(expense.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {expenses.length === 0 ? <p className="rounded-2xl bg-white p-5 text-sm text-ink-600 shadow-card">No expenses yet.</p> : null}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-pine-900">Advances</h2>
            <p className="text-xs text-ink-600">Correct advance contributions when needed.</p>
          </div>
          <span className="rounded-full bg-sunrise-100 px-3 py-1 text-xs font-semibold text-sunrise-700">{advances.length}</span>
        </div>
        <div className="flex flex-col gap-3">
          {advances.map((advance) => (
            <div key={advance.id} className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-pine-900">{memberNames[advance.memberId] ?? 'Member'}</p>
                  <p className="mt-1 text-xs text-ink-600">{advance.note || 'Trip advance'}</p>
                  <p className="mt-2 font-display text-lg font-bold text-pine-900">{formatINR(advance.amountPaise)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openAdvanceEdit(advance)} className="rounded-xl bg-mist-100 px-3 py-2 text-xs font-semibold text-pine-800">Edit</button>
                  <button disabled={busyId === advance.id} onClick={() => removeAdvance(advance.id)} className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
          {advances.length === 0 ? <p className="rounded-2xl bg-white p-5 text-sm text-ink-600 shadow-card">No advances yet.</p> : null}
        </div>
      </section>

      <Modal open={editingAdvance !== null} onClose={() => setEditingAdvance(null)} title="Correct advance">
        <form onSubmit={saveAdvanceEdit} className="flex flex-col gap-4">
          <p className="rounded-xl bg-mist-50 px-3 py-2 text-sm text-ink-700">Member: <strong>{editingAdvance ? memberNames[editingAdvance.memberId] : ''}</strong></p>
          <Field label="Amount" type="number" inputMode="decimal" min="0.01" step="0.01" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} required />
          <Field label="Note (optional)" value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} />
          <Button type="submit" fullWidth loading={busyId === editingAdvance?.id}>Save correction</Button>
        </form>
      </Modal>
    </div>
  );
}
