import { Intent } from '../types/domain.js';

export function detectIntent(text: string, hasImage = false): Intent {
  const lower = text.toLowerCase();
  if (/history|previous|last season|record|before|what happened|asked|show previous|past/.test(lower)) return 'MEMORY_QUERY';
  if (hasImage || /yellow|leaf|rust|spot|disease symptom|fungus|infect|pest|blight|mildew/.test(lower)) return 'DISEASE';
  if (/fertilizer|yield|production|urea|dap|harvest|increase|seed rate|spray/.test(lower)) return 'YIELD_ADVICE';
  if (/plan|layout|kanal|acre|divide|irrigation|schedule|water|section|plot/.test(lower)) return 'FARM_PLANNING';
  return 'GENERAL_AGRICULTURE';
}

export function intentPriority(intents: Intent[]): Intent {
  if (intents.includes('DISEASE')) return 'DISEASE';
  return intents[0] ?? 'GENERAL_AGRICULTURE';
}
