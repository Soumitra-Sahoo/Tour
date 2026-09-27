import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Field } from '../components/common/Field';
import { Button } from '../components/common/Button';
import { getTripByShareToken } from '../api/trip';
import { ApiError } from '../api/client';

function extractShareToken(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/trip\/([^/]+)/);
    if (match?.[1]) return match[1];
  } catch {
    // Treat it as a raw share token when it is not a full URL.
  }

  const match = trimmed.match(/\/trip\/([^/]+)/);
  return match?.[1] ?? trimmed.replace(/^\/+|\/+$/g, '');
}

export function LoginPage() {
  const navigate = useNavigate();
  const [shareLink, setShareLink] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [savedTripName, setSavedTripName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('wd_last_trip_token');
    const tripName = localStorage.getItem('wd_last_trip_name');
    if (token) setSavedToken(token);
    if (tripName) setSavedTripName(tripName);
  }, []);

  async function openTrip(value: string) {
    const token = extractShareToken(value);
    if (!token) {
      setError('Please enter your trip link.');
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      const { trip } = await getTripByShareToken(token);
      localStorage.setItem('wd_last_trip_token', trip.shareToken);
      localStorage.setItem('wd_last_trip_name', trip.name);
      navigate(`/trip/${trip.shareToken}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'This trip link is not valid.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await openTrip(shareLink);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-10">
      <div className="mb-8 text-center">
        <p className="font-display text-3xl font-semibold text-pine-900">Welcome Darjeeling 🏔️</p>
        <p className="mt-2 text-ink-600">Open your trip and start tracking expenses.</p>
      </div>

      {savedToken ? (
        <div className="mb-5 rounded-2xl border border-mist-200 bg-mist-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Your saved trip</p>
          <p className="mt-1 font-display text-lg font-semibold text-pine-900">
            {savedTripName || 'Darjeeling Trip'}
          </p>
          <Button type="button" fullWidth className="mt-3" loading={submitting} onClick={() => openTrip(savedToken)}>
            Continue to trip
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field
          label="Trip link"
          placeholder="Paste the link shared by the trip owner"
          value={shareLink}
          onChange={(e) => setShareLink(e.target.value)}
          autoFocus={!savedToken}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" fullWidth loading={submitting}>
          Open Trip
        </Button>
      </form>

      <button
        type="button"
        className="mt-6 text-center text-sm font-medium text-pine-800 underline-offset-4 hover:underline"
        onClick={() => navigate('/create')}
      >
        Trip owner? Create a new trip
      </button>
    </div>
  );
}
