import express, { Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { attachSession } from './middleware/identify';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import tripRoutes from './routes/tripRoutes';
import memberRoutes from './routes/memberRoutes';
import sessionRoutes from './routes/sessionRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tripExpenseRoutes from './routes/tripExpenseRoutes';
import expenseRoutes from './routes/expenseRoutes';
import balanceRoutes, { summaryRouter } from './routes/balanceRoutes';
import { tripSettlementRouter, settlementActionRouter } from './routes/settlementRoutes';
import advanceRoutes, { advanceActionRouter } from './routes/advanceRoutes';

export function createApp(): Express {
  const app = express();

  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim());

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachSession);

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.use('/api/trip/:tripId/members', memberRoutes);
  app.use('/api/trip/:tripId/session', sessionRoutes);
  app.use('/api/trip/:tripId/categories', categoryRoutes);
  app.use('/api/trip/:tripId/expenses', tripExpenseRoutes);
  app.use('/api/trip/:tripId/balances', balanceRoutes);
  app.use('/api/trip/:tripId/summary', summaryRouter);
  app.use('/api/trip/:tripId/settlements', tripSettlementRouter);
  app.use('/api/trip/:tripId/advances', advanceRoutes);
  app.use('/api/trip', tripRoutes);

  app.use('/api/expenses', expenseRoutes);
  app.use('/api/settlements', settlementActionRouter);
  app.use('/api/advances', advanceActionRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
