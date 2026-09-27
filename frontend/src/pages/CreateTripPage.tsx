import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '../components/common/Field';
import { Button } from '../components/common/Button';
import { createTrip } from '../api/trip';
import { useSession } from '../context/SessionContext';
import { ApiError } from '../api/client';

export function CreateTripPage() {
  const navigate = useNavigate();
  const { setTrip, setMember } = useSession();
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !ownerName.trim()) {
      setError('Please fill in the trip name and your name.');
      return;
    }
    setSubmitting(true);
    try {
      const { trip, member } = await createTrip({
        name: name.trim(),
        ownerName: ownerName.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setTrip(trip);
      setMember(member);
      navigate(`/trip/${trip.shareToken}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-semibold text-pine-900">Welcome Darjeeling 🏔️</p>
        <p className="mt-2 text-ink-600">Create a simple expense tracker for your trip.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Trip Name"
          placeholder="Darjeeling Trip"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Field
          label="Your Name"
          placeholder="e.g. Soumitra"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Field
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Field label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" fullWidth loading={submitting}>
          Create Trip
        </Button>
      </form>
    </div>
  );
}
