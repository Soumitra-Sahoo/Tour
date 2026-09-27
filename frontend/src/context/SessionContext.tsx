import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trip, CurrentMember } from '../types';
import { getTripByShareToken } from '../api/trip';
import { getCurrentMember, switchOut as apiSwitchOut } from '../api/member';

interface SessionState {
  trip: Trip | null;
  member: CurrentMember | null;
  loading: boolean;
  error: string | null;
  loadTrip: (shareToken: string) => Promise<Trip | null>;
  setMember: (member: CurrentMember | null) => void;
  setTrip: (trip: Trip | null) => void;
  refreshMember: () => Promise<void>;
  switchPerson: () => Promise<void>;
}

const SessionContext = createContext<SessionState | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [member, setMember] = useState<CurrentMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTrip = useCallback(async (shareToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const { trip: loadedTrip } = await getTripByShareToken(shareToken);
      setTrip(loadedTrip);
      localStorage.setItem('wd_last_trip_token', loadedTrip.shareToken);
      localStorage.setItem('wd_last_trip_name', loadedTrip.name);
      const { member: currentMember } = await getCurrentMember(loadedTrip.id);
      setMember(currentMember);
      return loadedTrip;
    } catch {
      setError('This trip link is not valid.');
      setTrip(null);
      setMember(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMember = useCallback(async () => {
    if (!trip) return;
    const { member: currentMember } = await getCurrentMember(trip.id);
    setMember(currentMember);
  }, [trip]);

  const switchPerson = useCallback(async () => {
    if (!trip) return;
    await apiSwitchOut(trip.id);
    setMember(null);
  }, [trip]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const value = useMemo(
    () => ({ trip, member, loading, error, loadTrip, setMember, setTrip, refreshMember, switchPerson }),
    [trip, member, loading, error, loadTrip, refreshMember, switchPerson],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
