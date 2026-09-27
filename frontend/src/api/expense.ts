import { api } from './client';
import { Expense, CreateExpensePayload } from '../types';
import { generateIdempotencyKey } from '../utils/money';

export function listExpenses(tripId: string) {
  return api.get<{ expenses: Expense[] }>(`/trip/${tripId}/expenses`);
}

export function getExpense(expenseId: string) {
  return api.get<{ expense: Expense }>(`/expenses/${expenseId}`);
}

export function createExpense(tripId: string, payload: CreateExpensePayload) {
  return api.post<{ expense: Expense }>(`/trip/${tripId}/expenses`, {
    ...payload,
    idempotencyKey: payload.idempotencyKey || generateIdempotencyKey(),
  });
}

export function updateExpense(expenseId: string, payload: Omit<CreateExpensePayload, 'idempotencyKey'>) {
  return api.patch<{ expense: Expense }>(`/expenses/${expenseId}`, payload);
}

export function deleteExpense(expenseId: string) {
  return api.delete<{ ok: true }>(`/expenses/${expenseId}`);
}
