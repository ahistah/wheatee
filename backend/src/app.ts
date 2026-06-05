import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import { optionalAuth } from './middleware/auth.js';
import { errorHandler } from './middleware/errors.js';
import { accountRouter } from './routes/account.js';
import { askRouter } from './routes/ask.js';
import { diagnoseRouter } from './routes/diagnose.js';
import { farmProfileRouter } from './routes/farmProfile.js';
import { healthRouter } from './routes/health.js';
import { historyRouter } from './routes/history.js';
import { knowledgeRouter } from './routes/knowledge.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin }));
  app.use(express.json({ limit: '12mb' }));
  app.use(optionalAuth);

  app.use(healthRouter);
  app.use(accountRouter);
  app.use(askRouter);
  app.use(diagnoseRouter);
  app.use(historyRouter);
  app.use(farmProfileRouter);
  app.use(knowledgeRouter);

  app.use(errorHandler);
  return app;
}
