import { nanoid } from 'nanoid';

/** A non-guessable, URL-safe public token used in the trip share link. */
export function generateShareToken(): string {
  return nanoid(21); // ~125 bits of entropy, URL-safe alphabet
}

/** A per-request idempotency key check helper (also usable standalone by clients). */
export function generateIdempotencyKey(): string {
  return nanoid(24);
}
