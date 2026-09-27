import { randomInt } from 'crypto';

/**
 * Generates an unpredictable 4-digit numeric member code.
 * Codes are intentionally not sequential and are unique within a trip.
 */
export function generateMemberCode(_tripName: string, existingCodes: string[]): string {
  const used = new Set(existingCodes.map((code) => code.trim()));

  // There are 9,000 possible codes (1000-9999), more than enough for a trip.
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const code = String(randomInt(1000, 10000));
    if (!used.has(code)) return code;
  }

  throw new Error('Unable to generate a unique member code.');
}

/** Normalize a member code for case-insensitive comparison. */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}
