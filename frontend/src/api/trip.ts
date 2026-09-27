import { api } from './client';
import { Trip, CurrentMember } from '../types';

export function createTrip(input: { name: string; ownerName: string; startDate?: string; endDate?: string }) {
  return api.post<{ trip: Trip; member: CurrentMember & { memberCode: string } }>('/trip', input);
}

export function getTripByShareToken(shareToken: string) {
  return api.get<{ trip: Trip }>(`/trip/${shareToken}`);
}

export function lockTrip(tripId: string) {
  return api.post<{ trip: { id: string; status: string } }>(`/trip/${tripId}/lock`);
}

export function reopenTrip(tripId: string) {
  return api.post<{ trip: { id: string; status: string } }>(`/trip/${tripId}/reopen`);
}

export function setTreasurer(tripId: string, memberId: string) {
  return api.post<{ trip: { id: string; treasurerId: string } }>(`/trip/${tripId}/treasurer`, { memberId });
}
