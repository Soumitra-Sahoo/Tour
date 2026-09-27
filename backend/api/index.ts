import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app';
import { connectDB } from '../src/config/db';

let dbConnected = false;

const app = createApp();

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (!dbConnected) {
      const mongoUri = process.env.MONGODB_URI;

      if (!mongoUri) {
        return res.status(500).json({
          message: 'MONGODB_URI is not configured',
        });
      }

      await connectDB(mongoUri);
      dbConnected = true;
    }

    return app(req, res);
  } catch (error) {
    console.error('API error:', error);

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}