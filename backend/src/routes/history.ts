import { Router } from 'express';

import { getHistory, saveHistoryRecord } from '../services/database.js';
import { assertUserAccess } from '../middleware/auth.js';
import { getCropImageDisplayURL } from '../services/storage.js';
import { HistoryRecord } from '../types/domain.js';
import { recordSchema } from '../utils/validation.js';

export const historyRouter = Router();

historyRouter.get('/history', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? '');
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    assertUserAccess(req, userId);
    const history = await getHistory(userId, limit);
    res.json(await withImageDisplayURLs(history));
  } catch (error) {
    next(error);
  }
});

historyRouter.post('/records', async (req, res, next) => {
  try {
    const payload = recordSchema.parse(req.body);
    assertUserAccess(req, payload.userId);
    const record = payload.data as HistoryRecord;
    const saved = await saveHistoryRecord({
      ...record,
      userId: payload.userId,
      type: payload.type,
      backendMode: 'remote',
    });
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

async function withImageDisplayURLs(records: HistoryRecord[]) {
  return Promise.all(
    records.map(async (record) => ({
      ...record,
      imageDisplayURL: record.imageDisplayURL ?? (await getCropImageDisplayURL(record.imageURL)),
    })),
  );
}
