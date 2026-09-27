import { Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { Member } from '../models/Member';
import { createTripSchema } from '../validation/schemas';
import { generateShareToken } from '../utils/token';
import { generateMemberCode } from '../utils/codeGenerator';
import { createSessionToken, SESSION_COOKIE_NAME } from '../utils/sessionToken';
import { asyncHandler } from '../utils/asyncHandler';
import { NotFoundError } from '../utils/AppError';

const COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

export const createTrip = asyncHandler(async (req: Request, res: Response) => {
  const input = createTripSchema.parse(req.body);

  const shareToken = generateShareToken();
  const memberCode = generateMemberCode(input.name, []);

  const trip = await Trip.create({
    name: input.name,
    startDate: input.startDate,
    endDate: input.endDate,
    shareToken,
    ownerId: undefined, // set after member is created below
  });

  const owner = await Member.create({
    tripId: trip._id,
    name: input.ownerName,
    memberCode,
    isOwner: true,
  });

  trip.ownerId = owner._id;
  await trip.save();

  const token = createSessionToken({ memberId: owner._id.toString(), tripId: trip._id.toString() });
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  });

  res.status(201).json({
    trip: {
      id: trip._id,
      name: trip.name,
      shareToken: trip.shareToken,
      status: trip.status,
      categories: trip.categories,
      treasurerId: trip.treasurerId,
    },
    member: { id: owner._id, name: owner.name, memberCode: owner.memberCode, isOwner: true },
  });
});

export const getTripByShareToken = asyncHandler(async (req: Request, res: Response) => {
  const trip = await Trip.findOne({ shareToken: req.params.shareToken });
  if (!trip) throw new NotFoundError('This trip link is not valid.');

  res.json({
    trip: {
      id: trip._id,
      name: trip.name,
      shareToken: trip.shareToken,
      status: trip.status,
      categories: trip.categories,
      ownerId: trip.ownerId,
      treasurerId: trip.treasurerId,
    },
  });
});

export const lockTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await Trip.findByIdAndUpdate(
    req.params.tripId,
    { status: 'locked' },
    { new: true },
  );
  if (!trip) throw new NotFoundError('Trip not found.');
  res.json({ trip: { id: trip._id, status: trip.status } });
});

export const setTreasurer = asyncHandler(async (req: Request, res: Response) => {
  const trip = await Trip.findById(req.params.tripId);
  if (!trip) throw new NotFoundError('Trip not found.');
  const member = await Member.findOne({ _id: req.body.memberId, tripId: req.params.tripId });
  if (!member) throw new NotFoundError('Member not found.');
  trip.treasurerId = member._id;
  await trip.save();
  res.json({ trip: { id: trip._id, treasurerId: trip.treasurerId } });
});

export const reopenTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await Trip.findByIdAndUpdate(
    req.params.tripId,
    { status: 'active' },
    { new: true },
  );
  if (!trip) throw new NotFoundError('Trip not found.');
  res.json({ trip: { id: trip._id, status: trip.status } });
});
