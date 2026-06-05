import { Router } from 'express';

import {
  allowFallbacks,
  config,
  isAiConfigured,
  isFirebaseConfigured,
  isSpeechConfigured,
  isStorageConfigured,
  isSupabaseConfigured,
  missingProductionConfig,
} from '../config.js';
import { getKnowledgeBase } from '../services/knowledge.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  const missingConfig = missingProductionConfig();
  const ready = missingConfig.length === 0;

  res.json({
    ok: true,
    ready,
    service: 'wheaty-api',
    mode: isAiConfigured() ? 'ai' : 'fallback',
    environment: config.nodeEnv,
    mongo: Boolean(config.mongoUri),
    supabase: isSupabaseConfigured(),
    firebase: isFirebaseConfigured(),
    storage: isStorageConfigured(),
    speech: isSpeechConfigured(),
    knowledgeBase: getKnowledgeBase().length,
    missingConfig: allowFallbacks() ? [] : missingConfig,
  });
});
