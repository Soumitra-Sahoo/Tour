import crypto from 'crypto';

/**
 * A lightweight, stateless "who is this browser" session token.
 *
 * This is intentionally NOT a full authentication system (per the spec):
 * there are no passwords, no OTP, no OAuth. A member's identity is
 * verified once via their member code, and from then on this signed
 * token (stored in an httpOnly cookie) lets their browser skip
 * re-entering the code. The signature prevents a client from forging a
 * token for a different member without knowing the server secret.
 */

const SECRET = process.env.SESSION_SECRET || 'welcome-darjeeling-dev-secret-change-me';

export interface SessionPayload {
  memberId: string;
  tripId: string;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
}

export function createSessionToken(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  const encoded = Buffer.from(json).toString('base64url');
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, signature] = parts;

  const expectedSignature = sign(encoded);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8');
    const payload = JSON.parse(json);
    if (typeof payload.memberId === 'string' && typeof payload.tripId === 'string') {
      return payload as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = 'wd_session';
