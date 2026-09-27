import { NextFunction, Request, Response } from 'express';
import { Types } from 'mongoose';
import { Member } from '../models/Member';
import { Trip } from '../models/Trip';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../utils/sessionToken';
import { UnauthorizedError, NotFoundError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      currentMember?: {
        id: string;
        tripId: string;
        isOwner: boolean;
        name: string;
      };
    }
  }
}

/**
 * Loads the current trip by :tripId param (or resolves it from :shareToken)
 * and, if a valid session cookie is present, attaches the identified member.
 * Does NOT reject the request if there is no session - routes that require
 * identification should use `requireMember` after this.
 */
export const attachSession = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME];
  const payload = verifySessionToken(token);
  if (!payload) return next();

  const member = await Member.findById(payload.memberId);
  if (!member || member.tripId.toString() !== payload.tripId) {
    return next();
  }

  req.currentMember = {
    id: member._id.toString(),
    tripId: member.tripId.toString(),
    isOwner: member.isOwner,
    name: member.name,
  };
  next();
});

/** Rejects the request unless a valid identified member is present for THIS trip. */
export function requireMember(req: Request, _res: Response, next: NextFunction) {
  const tripId = req.params.tripId;
  if (!req.currentMember) {
    throw new UnauthorizedError('Please identify yourself to continue.');
  }
  if (tripId && req.currentMember.tripId !== tripId) {
    throw new UnauthorizedError('Please identify yourself to continue.');
  }
  next();
}

/** Rejects the request unless the identified member is the trip owner. */
export function requireOwner(req: Request, _res: Response, next: NextFunction) {
  if (!req.currentMember?.isOwner) {
    throw new UnauthorizedError('Only the trip owner can do that.');
  }
  next();
}

/** Loads a trip by its :tripId route param and attaches it to req.trip. */
export function loadTripById() {
  return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    const { tripId } = req.params;
    if (!Types.ObjectId.isValid(tripId)) {
      throw new NotFoundError('Trip not found.');
    }
    const trip = await Trip.findById(tripId);
    if (!trip) throw new NotFoundError('Trip not found.');
    (req as Request & { trip?: unknown }).trip = trip;
    next();
  });
}
