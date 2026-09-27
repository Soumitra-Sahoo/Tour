import { useEffect, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { listMembers, addMember, listCategories, addCategory } from '../api/member';
import { lockTrip, reopenTrip, setTreasurer } from '../api/trip';
import { Member, Category } from '../types';
import { Spinner } from '../components/common/Spinner';
import { EmptyState } from '../components/common/EmptyState';
import { MemberList } from '../components/people/MemberList';
import { AddPersonModal } from '../components/people/AddPersonModal';
import { Button } from '../components/common/Button';
import { Field } from '../components/common/Field';
import { Modal } from '../components/common/Modal';
import { ApiError } from '../api/client';

export function PeoplePage() {
  const { trip, member, setTrip } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPerson, setShowAddPerson] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);
  const [lockToggling, setLockToggling] = useState(false);

  async function load() {
    if (!trip) return;
    const [m, c] = await Promise.all([listMembers(trip.id), listCategories(trip.id)]);
    setMembers(m.members);
    setCategories(c.categories);
  }

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip]);

  if (loading || !trip || !member) return <Spinner label="Loading people…" />;

  async function handleAddPerson(name: string) {
    if (!trip) return;
    const { member: created } = await addMember(trip.id, name);
    await load();
    return { name: created.name, memberCode: created.memberCode || '' };
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !newCategory.trim()) {
      setCategoryError('Please enter a category name.');
      return;
    }
    setAddingCategory(true);
    setCategoryError(null);
    try {
      await addCategory(trip.id, newCategory.trim());
      setNewCategory('');
      setShowAddCategory(false);
      await load();
    } catch (err) {
      setCategoryError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleTreasurerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (!trip || !member || !member.isOwner || !e.target.value) return;
    const { trip: updated } = await setTreasurer(trip.id, e.target.value);
    setTrip({ ...trip, treasurerId: updated.treasurerId });
  }

  async function handleToggleLock() {
    if (!trip) return;
    setLockToggling(true);
    try {
      const { trip: updated } =
        trip.status === 'active' ? await lockTrip(trip.id) : await reopenTrip(trip.id);
      setTrip({ ...trip, status: updated.status as 'active' | 'locked' });
    } finally {
      setLockToggling(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {member.isOwner ? (
        <div className="rounded-2xl border border-mist-200 bg-white p-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold text-pine-900">Owner controls</p>
              <p className="mt-1 text-xs text-ink-600">Correct or remove a wrong expense/advance.</p>
            </div>
            <a href={`/trip/${trip.shareToken}/admin`} className="rounded-xl bg-pine-900 px-3 py-2 text-xs font-semibold text-white">Open Admin</a>
          </div>
        </div>
      ) : null}

      {member.isOwner ? (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            fullWidth
            onClick={() => {
              const url = `${window.location.origin}/trip/${trip.shareToken}`;
              if (navigator.share) {
                navigator.share({ title: 'Welcome Darjeeling 🏔️', url }).catch(() => {});
              } else {
                navigator.clipboard.writeText(url);
              }
            }}
          >
            🔗 Share Trip
          </Button>
          <Button
            variant={trip.status === 'active' ? 'ghost' : 'secondary'}
            fullWidth
            onClick={handleToggleLock}
            loading={lockToggling}
          >
            {trip.status === 'active' ? '🔒 Lock Trip' : 'Reopen Trip'}
          </Button>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-xl font-semibold text-pine-900">People</p>
          {member.isOwner && trip.status === 'active' ? (
            <Button onClick={() => setShowAddPerson(true)}>+ Add Person</Button>
          ) : null}
        </div>
        {members.length === 0 ? (
          <EmptyState title="Add your friends to start tracking expenses." />
        ) : (
          <MemberList members={members} isOwnerView={member.isOwner} />
        )}
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-card">
        <p className="font-display text-lg font-semibold text-pine-900">Trip Treasurer</p>
        <p className="mt-1 text-xs text-ink-600">Advance money is held by the selected treasurer.</p>
        {member.isOwner && trip.status === 'active' ? (
          <select
            value={trip.treasurerId ?? ''}
            onChange={handleTreasurerChange}
            className="mt-3 w-full rounded-xl border border-mist-200 bg-white px-3.5 py-3 text-base text-pine-900 outline-none focus:border-mist-500"
          >
            <option value="">Select treasurer</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        ) : (
          <p className="mt-2 font-semibold text-pine-900">{members.find((m) => m.id === trip.treasurerId)?.name ?? 'Not selected'}</p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="font-display text-lg font-semibold text-pine-900">Categories</p>
          {member.isOwner && trip.status === 'active' ? (
            <button
              onClick={() => setShowAddCategory(true)}
              className="text-sm font-medium text-mist-600"
            >
              + Add Category
            </button>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <span key={c.id} className="rounded-full bg-white px-3 py-1.5 text-sm text-pine-900 shadow-card">
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <AddPersonModal open={showAddPerson} onClose={() => setShowAddPerson(false)} onAdd={handleAddPerson} />

      <Modal open={showAddCategory} onClose={() => setShowAddCategory(false)} title="Add Category">
        <form onSubmit={handleAddCategory} className="flex flex-col gap-4">
          <Field
            label="Category name"
            placeholder="e.g. Tea"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            autoFocus
          />
          {categoryError ? <p className="text-sm text-red-600">{categoryError}</p> : null}
          <Button type="submit" fullWidth loading={addingCategory}>
            Add Category
          </Button>
        </form>
      </Modal>
    </div>
  );
}
