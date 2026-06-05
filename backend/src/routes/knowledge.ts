import { Router } from 'express';

import { getKnowledgeBase } from '../services/knowledge.js';

export const knowledgeRouter = Router();

knowledgeRouter.get('/knowledge-base', (_req, res) => {
  res.json(getKnowledgeBase());
});
