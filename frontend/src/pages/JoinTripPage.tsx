import { useEffect, useState } from 'react';
import { Field } from '../components/common/Field';
import { Button } from '../components/common/Button';
import { Spinner } from '../components/common/Spinner';
import { listMembers, identify } from '../api/member';
import { useSession } from '../context/SessionContext';
import { ApiError } from '../api/client';
import { Member } from '../types';

export function JoinTripPage() {
  const { trip, refreshMember } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [memberId, setMemberId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!trip) return;
    listMembers(trip.id)
      .then(({ members }) => {
        setMembers(members);
        if (members.length > 0) setMemberId(members[0].id);
      })
      .finally(() => setLoadingMembers(false));
  }, [trip]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trip) return;
    setError(null);
    if (!memberId || !code.trim()) {
      setError('Please select who you are and enter your code.');
      return;
    }
    setSubmitting(true);
    try {
      await identify(trip.id, memberId, code.trim());
      await refreshMember();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid member code.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingMembers) return <Spinner label="Loading trip…" />;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-semibold text-pine-900">Welcome Darjeeling 🏔️</p>
        <p className="mt-1 text-ink-600">{trip?.name}</p>
        <p className="mt-3 font-display text-lg text-pine-900">Who are you?</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink-900">Select your name</span>
          <select
            value={memberId}
            onChange={(e) => setMemberId(e.target.value)}
            className="w-full rounded-xl border border-mist-200 bg-white px-3.5 py-3 text-base text-pine-900 outline-none focus:border-mist-500"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <Field
          label="Enter your code"
          placeholder="e.g. DJ02"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoCapitalize="characters"
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" fullWidth loading={submitting}>
          Continue
        </Button>
      </form>
    </div>
  );
}
