import { api } from './client';
import { Advance } from '../types';

export function listAdvances(tripId: string) {
  return api.get<{ advances: Advance[] }>(`/trip/${tripId}/advances`);
}

export function addAdvance(tripId: string, memberId: string, amount: string, note?: string) {
  return api.post<{ advance: Advance }>(`/trip/${tripId}/advances`, { memberId, amount, note });
}

export function updateAdvance(advanceId: string, data: { memberId?: string; amount?: string; note?: string }) {
  return api.patch<{ advance: Advance }>(`/advances/${advanceId}`, data);
}

export function deleteAdvance(advanceId: string) {
  return api.delete<{ ok: true }>(`/advances/${advanceId}`);
}
