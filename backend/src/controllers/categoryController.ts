import { Request, Response } from 'express';
import { Trip } from '../models/Trip';
import { addCategorySchema } from '../validation/schemas';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError, NotFoundError } from '../utils/AppError';

export const listCategories = asyncHandler(async (req: Request, res: Response) => {
  const trip = await Trip.findById(req.params.tripId).select('categories');
  if (!trip) throw new NotFoundError('Trip not found.');
  res.json({ categories: trip.categories.map((c) => ({ id: c._id, name: c.name })) });
});

export const addCategory = asyncHandler(async (req: Request, res: Response) => {
  const { tripId } = req.params;
  const input = addCategorySchema.parse(req.body);

  const trip = await Trip.findById(tripId);
  if (!trip) throw new NotFoundError('Trip not found.');
  if (trip.status === 'locked') throw new AppError('This trip is locked.', 403);

  const nameExists = trip.categories.some(
    (c) => c.name.toLowerCase() === input.name.toLowerCase(),
  );
  if (nameExists) throw new AppError('That category already exists.', 409);

  trip.categories.push({ name: input.name } as never);
  await trip.save();

  const created = trip.categories[trip.categories.length - 1];
  res.status(201).json({ category: { id: created._id, name: created.name } });
});
