import { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { MoneyError } from '../services/money';

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found.' });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof MoneyError) {
    return res.status(400).json({ error: err.message });
  }

  if (err && typeof err === 'object' && 'name' in err) {
    const mongoErr = err as { name: string; code?: number; message?: string };

    if (mongoErr.name === 'ValidationError') {
      return res.status(400).json({ error: 'Some of the information provided is invalid.' });
    }
    if (mongoErr.code === 11000) {
      return res.status(409).json({ error: 'That already exists. Please try again.' });
    }
    if (mongoErr.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid request.' });
    }
  }

  // eslint-disable-next-line no-console
  console.error('Unexpected error:', err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}
