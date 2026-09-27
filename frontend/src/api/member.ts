import { api } from './client';
import { Member, CurrentMember, Category } from '../types';

export function listMembers(tripId: string) {
  return api.get<{ members: Member[] }>(`/trip/${tripId}/members`);
}

export function addMember(tripId: string, name: string) {
  return api.post<{ member: Member }>(`/trip/${tripId}/members`, { name });
}

export function identify(tripId: string, memberId: string, code: string) {
  return api.post<{ member: CurrentMember }>(`/trip/${tripId}/members/identify`, { memberId, code });
}

export function getCurrentMember(tripId: string) {
  return api.get<{ member: CurrentMember | null }>(`/trip/${tripId}/session`);
}

export function switchOut(tripId: string) {
  return api.post<{ ok: true }>(`/trip/${tripId}/session/switch-out`);
}

export function listCategories(tripId: string) {
  return api.get<{ categories: Category[] }>(`/trip/${tripId}/categories`);
}

export function addCategory(tripId: string, name: string) {
  return api.post<{ category: Category }>(`/trip/${tripId}/categories`, { name });
}
