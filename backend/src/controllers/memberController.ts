import { Request, Response } from 'express';
import { Member } from '../models/Member';
import { Trip } from '../models/Trip';
import { addMemberSchema, identifySchema } from '../validation/schemas';
import { generateMemberCode, normalizeCode } from '../utils/codeGenerator';
import { createSessionToken, SESSION_COOKIE_NAME } from '../utils/sessionToken';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, NotFoundError, UnauthorizedError } from '../utils/AppError';

const COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365; // 1 year

export const addMember = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const input = addMemberSchema.parse(req.body);

  const trip = await Trip.findById(tripId);
  if (!trip) throw new NotFoundError('Trip not found.');
  if (trip.status === 'locked') throw new AppError('This trip is locked.', 403);

  const existing = await Member.find({ tripId }).select('memberCode');
  const memberCode = generateMemberCode(trip.name, existing.map((m) => m.memberCode));

  const member = await Member.create({
    tripId,
    name: input.name,
    memberCode,
    isOwner: false,
  });

  res.status(201).json({
    member: { id: member._id, name: member.name, memberCode: member.memberCode, isOwner: false },
  });
});

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const members = await Member.find({ tripId }).sort({ createdAt: 1 });

  const isOwnerRequest = req.currentMember?.isOwner && req.currentMember.tripId === tripId;

  res.json({
    members: members.map((m) => ({
      id: m._id,
      name: m.name,
      isOwner: m.isOwner,
      // Only the trip owner can see everyone's codes (Section 41).
      memberCode: isOwnerRequest ? m.memberCode : undefined,
    })),
  });
});

export const identify = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const input = identifySchema.parse(req.body);

  const member = await Member.findOne({ tripId, _id: input.memberId });
  if (!member) throw new UnauthorizedError('Invalid member code.');

  if (normalizeCode(member.memberCode) !== normalizeCode(input.code)) {
    throw new UnauthorizedError('Invalid member code.');
  }

  const token = createSessionToken({ memberId: member._id.toString(), tripId });
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE_MS,
  });

  res.json({
    member: { id: member._id, name: member.name, isOwner: member.isOwner },
  });
});

export const getCurrentMember = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  if (!req.currentMember || req.currentMember.tripId !== tripId) {
    return res.json({ member: null });
  }
  return res.json({
    member: {
      id: req.currentMember.id,
      name: req.currentMember.name,
      isOwner: req.currentMember.isOwner,
    },
  });
});

export const switchOut = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME);
  res.json({ ok: true });
});
