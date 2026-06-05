import { Router } from 'express';

import { getFarmProfile, getHistory, saveHistoryRecord } from '../services/database.js';
import { generateAdvice } from '../services/gemini.js';
import { mergeTextAndAudio } from '../services/speech.js';
import { assertUserAccess } from '../middleware/auth.js';
import { HistoryRecord } from '../types/domain.js';
import { formatAdvice } from '../utils/format.js';
import { askSchema } from '../utils/validation.js';

export const askRouter = Router();

askRouter.post('/ask', async (req, res, next) => {
  try {
    const payload = askSchema.parse(req.body);
    assertUserAccess(req, payload.userId);
    const input = await mergeTextAndAudio(payload.text, payload.audioBase64, payload.audioMimeType);
    const farmProfile = payload.farmProfile ?? (await getFarmProfile(payload.userId));
    const history = await getHistory(payload.userId, 20);
    const result = await generateAdvice(input, farmProfile, history);

    const record: HistoryRecord = {
      id: `record-${Date.now()}`,
      userId: payload.userId,
      type: result.intent === 'FARM_PLANNING' ? 'plan' : 'conversation',
      input,
      response: formatAdvice(result),
      intent: result.intent,
      timestamp: new Date().toISOString(),
      actionItems: result.actionItems,
      backendMode: 'remote',
    };
    await saveHistoryRecord(record);

    res.json(result);
  } catch (error) {
    next(error);
  }
});
