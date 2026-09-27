import { useEffect, useMemo, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { addAdvance, listAdvances } from '../api/advance';
import { listMembers } from '../api/member';
import { Advance, Member } from '../types';
import { formatDateTime, formatINR } from '../utils/money';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Field } from '../components/common/Field';
import { Modal } from '../components/common/Modal';
import { ApiError } from '../api/client';
import { toPaise } from '../utils/splitPreview';

export function AdvancePage() {
  const { trip, member } = useSession();
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!trip) return;
    const [a, m] = await Promise.all([listAdvances(trip.id), listMembers(trip.id)]);
    setAdvances(a.advances);
    setMembers(m.members);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]);

  const membersById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const total = advances.reduce((sum, a) => sum + a.amountPaise, 0);

  function openAdd() {
    setSelectedMember(member?.id ?? '');
    setAmount('');
    setNote('');
    setError(null);
    setOpen(true);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !member) return;
    const paise = toPaise(amount);
    if (!paise || paise <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (!selectedMember) {
      setError('Please select a person.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await addAdvance(trip.id, selectedMember, amount, note || undefined);
      await load();
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !trip || !member) return <Spinner label="Loading advances…" />;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-semibold text-pine-900">Advance</p>
          <p className="text-sm text-ink-600">Money contributed before or during the trip.</p>
        </div>
        {trip.status === 'active' ? <Button onClick={openAdd}>+ Add Advance</Button> : null}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-xs font-medium text-ink-600">Total Advance</p>
        <p className="font-display text-3xl font-bold text-pine-900">{formatINR(total)}</p>
        <p className="mt-1 text-xs text-ink-500">Advance is separate from trip expenses.</p>
      </div>

      <div>
        <p className="mb-2 font-display text-lg font-semibold text-pine-900">All Advances</p>
        {advances.length === 0 ? (
          <EmptyState title="No advance added yet." description="Add money contributed for the trip here." />
        ) : (
          <div className="flex flex-col gap-2">
            {advances.map((a) => (
              <div key={a.id} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-pine-900">{membersById[a.memberId]?.name ?? '—'}</p>
                    {a.note ? <p className="mt-0.5 text-sm text-ink-600">{a.note}</p> : null}
                    <p className="mt-1 text-xs text-ink-400">{formatDateTime(a.createdAt)}</p>
                  </div>
                  <p className="font-display text-xl font-semibold text-mist-600">{formatINR(a.amountPaise)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Advance">
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          {member.isOwner ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-900">Contributed by</span>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full rounded-xl border border-mist-200 bg-white px-3.5 py-3 text-base text-pine-900 outline-none focus:border-mist-500"
              >
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
          ) : (
            <div className="rounded-xl bg-mist-50 p-3 text-sm text-ink-700">Contributed by <strong>{member.name}</strong></div>
          )}
          <Field label="Amount" prefix="₹" inputMode="decimal" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          <Field label="Note (optional)" placeholder="e.g. Advance for tour" value={note} maxLength={140} onChange={(e) => setNote(e.target.value)} />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" fullWidth loading={saving}>Add Advance</Button>
        </form>
      </Modal>
    </div>
  );
}
