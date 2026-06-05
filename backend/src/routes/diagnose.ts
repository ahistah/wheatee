import { Router } from 'express';

import { getFarmProfile, saveHistoryRecord } from '../services/database.js';
import { diagnoseCrop } from '../services/gemini.js';
import { assertUserAccess } from '../middleware/auth.js';
import { mergeTextAndAudio } from '../services/speech.js';
import { getCropImageDisplayURL, uploadCropImage } from '../services/storage.js';
import { HistoryRecord } from '../types/domain.js';
import { formatDiagnosis } from '../utils/format.js';
import { diagnoseSchema } from '../utils/validation.js';

export const diagnoseRouter = Router();

diagnoseRouter.post('/diagnose', async (req, res, next) => {
  try {
    const payload = diagnoseSchema.parse(req.body);
    assertUserAccess(req, payload.userId);
    const [farmProfile, imageURL] = await Promise.all([
      getFarmProfile(payload.userId),
      uploadCropImage(payload.userId, payload.imageBase64, payload.imageMimeType),
    ]);
    const input = await mergeTextAndAudio(payload.text, payload.audioBase64, payload.audioMimeType);
    const result = await diagnoseCrop(input, payload.imageBase64, payload.imageMimeType, farmProfile);
    const imageDisplayURL = await getCropImageDisplayURL(imageURL);
    result.imageURL = imageURL;
    result.imageDisplayURL = imageDisplayURL;

    const record: HistoryRecord = {
      id: `diagnosis-${Date.now()}`,
      userId: payload.userId,
      type: 'diagnosis',
      input: input || 'Crop image diagnosis',
      response: formatDiagnosis(result),
      intent: 'DISEASE',
      timestamp: new Date().toISOString(),
      imageURL,
      imageDisplayURL,
      confidence: result.confidence,
      actionItems: result.treatmentSteps,
      backendMode: 'remote',
    };
    await saveHistoryRecord(record);

    res.json(result);
  } catch (error) {
    next(error);
  }
});
