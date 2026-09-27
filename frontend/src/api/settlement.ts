import { api } from './client';
import { MemberBalance, Settlement, TripSummary } from '../types';

export function getBalances(tripId: string) {
  return api.get<{ balances: MemberBalance[] }>(`/trip/${tripId}/balances`);
}

export function getSummary(tripId: string) {
  return api.get<TripSummary>(`/trip/${tripId}/summary`);
}

export function listSettlements(tripId: string) {
  return api.get<{ settlements: Settlement[] }>(`/trip/${tripId}/settlements`);
}

export function markSettlementPaid(settlementId: string) {
  return api.post<{ settlement: Settlement }>(`/settlements/${settlementId}/mark-paid`);
}
