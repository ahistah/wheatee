import { Router } from 'express';

import { assertUserAccess } from '../middleware/auth.js';
import { deleteFarmerData } from '../services/database.js';
import { deleteFarmerCropImages } from '../services/storage.js';

export const accountRouter = Router();

accountRouter.delete('/account-data', async (req, res, next) => {
  try {
    const userId = String(req.query.userId ?? req.body?.userId ?? '');
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    assertUserAccess(req, userId);
    const cropImagesDeleted = await deleteFarmerCropImages(userId);
    const deleted = await deleteFarmerData(userId);
    res.json({
      ...deleted,
      cropImagesDeleted,
    });
  } catch (error) {
    next(error);
  }
});
