import { useEffect } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { Spinner } from '../components/common/Spinner';
import { Header } from '../components/layout/Header';
import { BottomNav } from '../components/layout/BottomNav';
import { JoinTripPage } from './JoinTripPage';

export function TripLayout() {
  const { shareToken } = useParams();
  const { trip, member, loading, error, loadTrip } = useSession();

  useEffect(() => {
    if (shareToken) loadTrip(shareToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareToken]);

  if (loading) return <Spinner label="Loading trip…" />;

  if (error || !trip) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-4xl">🏔️</p>
        <p className="font-display text-lg font-semibold text-pine-900">This trip link is not valid.</p>
        <p className="text-sm text-ink-600">Double check the link your friend shared with you.</p>
      </div>
    );
  }

  if (!member) return <JoinTripPage />;

  return (
    <div className="mx-auto min-h-screen max-w-md pb-24">
      <Header />
      <main className="px-4 py-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
