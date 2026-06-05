import { Router } from 'express';

import { getFarmProfile, saveFarmProfile } from '../services/database.js';
import { assertUserAccess } from '../middleware/auth.js';
import { farmProfileSchema } from '../utils/validation.js';

export const farmProfileRouter = Router();

farmProfileRouter.post('/farm-profile', async (req, res, next) => {
  try {
    const profile = farmProfileSchema.parse(req.body);
    assertUserAccess(req, profile.userId);
    const saved = await saveFarmProfile(profile);
    res.json(saved);
  } catch (error) {
    next(error);
  }
});

farmProfileRouter.get('/farm-profile', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? '');
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    assertUserAccess(req, userId);
    res.json(await getFarmProfile(userId));
  } catch (error) {
    next(error);
  }
});
