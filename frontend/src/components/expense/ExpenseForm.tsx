import { useMemo, useState } from 'react';
import { Member, Category, PayerFormEntry, ShareFormEntry } from '../../types';
import { Field } from '../common/Field';
import { Button } from '../common/Button';
import { toPaise } from '../../utils/splitPreview';

export interface ExpenseFormValue {
  amount: string;
  note: string;
  category: string;
  payers: PayerFormEntry[];
  participantIds: string[];
  splitType: 'equal' | 'custom';
  customShares: ShareFormEntry[];
}

interface ExpenseFormProps {
  members: Member[];
  categories: Category[];
  currentMemberId: string;
  initialValue?: Partial<ExpenseFormValue>;
  onSubmit: (value: ExpenseFormValue) => void;
  submitLabel?: string;
}

export function ExpenseForm({
  members,
  categories,
  currentMemberId,
  initialValue,
  onSubmit,
  submitLabel = 'Continue',
}: ExpenseFormProps) {
  const [amount, setAmount] = useState(initialValue?.amount ?? '');
  const [note, setNote] = useState(initialValue?.note ?? '');
  const [category, setCategory] = useState(initialValue?.category ?? categories[0]?.name ?? '');
  const [payers, setPayers] = useState<PayerFormEntry[]>(
    initialValue?.payers ?? [{ memberId: currentMemberId }],
  );
  const [participantIds, setParticipantIds] = useState<string[]>(
    initialValue?.participantIds ?? members.map((m) => m.id),
  );
  const [splitType, setSplitType] = useState<'equal' | 'custom'>(initialValue?.splitType ?? 'equal');
  const [customShares, setCustomShares] = useState<ShareFormEntry[]>(initialValue?.customShares ?? []);
  const [error, setError] = useState<string | null>(null);

  const amountPaise = toPaise(amount);
  const multiplePayers = payers.length > 1;

  const customTotalPaise = useMemo(
    () => customShares.reduce((sum, s) => sum + (toPaise(s.amount || '0') || 0), 0),
    [customShares],
  );

  function toggleParticipant(id: string) {
    setParticipantIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
    setCustomShares((prev) => prev.filter((s) => s.memberId !== id));
  }

  function addPayer() {
    const unused = members.find((m) => !payers.some((p) => p.memberId === m.id));
    if (unused) setPayers((prev) => [...prev, { memberId: unused.id }]);
  }

  function updatePayerAmount(memberId: string, value: string) {
    setPayers((prev) => prev.map((p) => (p.memberId === memberId ? { ...p, amount: value } : p)));
  }

  function updatePayerMember(index: number, memberId: string) {
    setPayers((prev) => prev.map((p, i) => (i === index ? { ...p, memberId } : p)));
  }

  function removePayer(index: number) {
    setPayers((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCustomShare(memberId: string, value: string) {
    setCustomShares((prev) => {
      const exists = prev.find((s) => s.memberId === memberId);
      if (exists) return prev.map((s) => (s.memberId === memberId ? { ...s, amount: value } : s));
      return [...prev, { memberId, amount: value }];
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!amountPaise || amountPaise <= 0) {
      setError('Please enter an amount.');
      return;
    }
    if (!category) {
      setError('Please choose a category.');
      return;
    }
    if (participantIds.length < 2) {
      setError('An expense must have at least 2 participants.');
      return;
    }
    if (multiplePayers) {
      const payerTotal = payers.reduce((sum, p) => sum + (toPaise(p.amount || '0') || 0), 0);
      if (payerTotal !== amountPaise) {
        setError(`The payer amounts must equal ${amount}.`);
        return;
      }
    }
    if (splitType === 'custom') {
      if (customTotalPaise !== amountPaise) {
        setError(`The participant amounts must equal ${amount}.`);
        return;
      }
    }

    onSubmit({
      amount,
      note,
      category,
      payers,
      participantIds,
      splitType,
      customShares,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-4">
      <Field
        label="Amount"
        prefix="₹"
        inputMode="decimal"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        autoFocus
      />

      <Field
        label="Note (optional)"
        placeholder="e.g. Dinner at Keventers"
        value={note}
        maxLength={140}
        onChange={(e) => setNote(e.target.value)}
      />

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-ink-900">Category</span>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-xl border border-mist-200 bg-white px-3.5 py-3 text-base text-pine-900 outline-none focus:border-mist-500"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-ink-900">Paid by</span>
          {!multiplePayers && payers.length < members.length ? (
            <button type="button" onClick={addPayer} className="text-sm font-medium text-mist-600">
              + Add another payer
            </button>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          {payers.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <select
                value={p.memberId}
                onChange={(e) => updatePayerMember(i, e.target.value)}
                className="flex-1 rounded-xl border border-mist-200 bg-white px-3.5 py-3 text-base text-pine-900 outline-none focus:border-mist-500"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {multiplePayers ? (
                <div className="flex w-32 items-center rounded-xl border border-mist-200 bg-white px-2">
                  <span className="text-ink-600">₹</span>
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={p.amount ?? ''}
                    onChange={(e) => updatePayerAmount(p.memberId, e.target.value)}
                    className="w-full rounded-xl bg-transparent px-1.5 py-3 text-base text-pine-900 outline-none"
                  />
                </div>
              ) : null}
              {payers.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removePayer(i)}
                  aria-label="Remove payer"
                  className="p-2 text-ink-400"
                >
                  ✕
                </button>
              ) : null}
            </div>
          ))}
        </div>
        {multiplePayers ? (
          <p className="mt-1 text-xs text-ink-600">
            Total paid so far: ₹{(payers.reduce((s, p) => s + (toPaise(p.amount || '0') || 0), 0) / 100).toFixed(2)}
          </p>
        ) : null}
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-900">Participants</span>
        <div className="flex flex-col gap-1 rounded-xl border border-mist-200 bg-white p-2">
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 active:bg-mist-100">
              <input
                type="checkbox"
                checked={participantIds.includes(m.id)}
                onChange={() => toggleParticipant(m.id)}
                className="h-5 w-5 accent-mist-500"
              />
              <span className="flex-1 text-pine-900">{m.name}</span>
              {splitType === 'custom' && participantIds.includes(m.id) ? (
                <div className="flex w-28 items-center rounded-lg border border-mist-200 px-2">
                  <span className="text-sm text-ink-600">₹</span>
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={customShares.find((s) => s.memberId === m.id)?.amount ?? ''}
                    onChange={(e) => updateCustomShare(m.id, e.target.value)}
                    className="w-full bg-transparent px-1 py-1.5 text-sm text-pine-900 outline-none"
                  />
                </div>
              ) : null}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-900">Split</span>
        <div className="flex gap-2">
          {(['equal', 'custom'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSplitType(type)}
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize ${
                splitType === type
                  ? 'border-pine-700 bg-pine-700 text-white'
                  : 'border-mist-200 bg-white text-pine-900'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        {splitType === 'custom' ? (
          <p className="mt-1 text-xs text-ink-600">
            Entered so far: ₹{(customTotalPaise / 100).toFixed(2)}
            {amountPaise ? ` of ₹${(amountPaise / 100).toFixed(2)}` : ''}
          </p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" fullWidth>
        {submitLabel}
      </Button>
    </form>
  );
}
