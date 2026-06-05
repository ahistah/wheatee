import { KnowledgeRecord, Intent } from '../types/domain.js';
import { knowledgeBase } from '../data/knowledgeBase.js';

function scoreRecord(record: KnowledgeRecord, text: string, intent: Intent) {
  const lower = text.toLowerCase();
  const intentScore = record.category === intent ? 10 : 0;
  const keywordScore = record.keywords.reduce((score, keyword) => score + (lower.includes(keyword) ? 1 : 0), 0);
  return intentScore + keywordScore;
}

export function findKnowledge(text: string, intent: Intent) {
  return [...knowledgeBase]
    .map((record) => ({ record, score: scoreRecord(record, text, intent) }))
    .sort((a, b) => b.score - a.score)
    .find((item) => item.score > 0)?.record ?? knowledgeBase.find((record) => record.category === intent);
}

export function getKnowledgeBase() {
  return knowledgeBase;
}
