import { AdviceResult, DiagnosisResult, FarmProfile, HistoryRecord, Intent } from '../types';
import { readJson, writeJson } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const HISTORY_KEY = 'wheaty.history';
const PROFILE_KEY = 'wheaty.profile';

type AskPayload = {
  text: string;
  audioUri?: string;
  userId: string;
  farmProfile?: FarmProfile | null;
};

type DiagnosePayload = {
  imageUri?: string;
  audioUri?: string;
  text?: string;
  userId: string;
};

async function request<T>(path: string, options: RequestInit): Promise<T | null> {
  if (!API_URL) return null;

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function detectIntent(text: string, hasImage = false): Intent {
  const lower = text.toLowerCase();
  if (hasImage || /yellow|leaf|rust|spot|disease|fungus|infect|pest/.test(lower)) return 'DISEASE';
  if (/fertilizer|yield|production|urea|dap|harvest|increase/.test(lower)) return 'YIELD_ADVICE';
  if (/plan|layout|kanal|acre|divide|irrigation|schedule|water/.test(lower)) return 'FARM_PLANNING';
  if (/history|previous|last season|record|before|diagnos/.test(lower)) return 'MEMORY_QUERY';
  return 'GENERAL_AGRICULTURE';
}

function mockAdvice(payload: AskPayload): AdviceResult {
  const intent = detectIntent(payload.text);
  const farm = payload.farmProfile;

  if (intent === 'FARM_PLANNING') {
    return {
      intent,
      response: `For ${farm?.farmSize || 'your farm'}, divide wheat into irrigation blocks, keep a service path along the longest side, and group plots by soil moisture so watering is easier to control.`,
      actionItems: [
        'Reserve 70% of land for wheat rows and 10% for paths and access.',
        'Create 3-4 irrigation sections with separate inlets.',
        'Schedule first irrigation 20-25 days after sowing, then adjust by soil moisture.',
      ],
    };
  }

  if (intent === 'MEMORY_QUERY') {
    return {
      intent,
      response: 'Your saved farm history is available on the History tab. Recent records are grouped by diagnosis, advice, and planning intent.',
      actionItems: ['Open History and filter by disease or planning.', 'Update farm profile before asking seasonal comparisons.'],
    };
  }

  if (intent === 'YIELD_ADVICE') {
    return {
      intent,
      response: `For ${farm?.cropTypes?.join(', ') || 'wheat'}, focus on balanced fertilizer, timely irrigation, weed control, and disease scouting before heading.`,
      actionItems: [
        'Apply fertilizer in split doses instead of all at sowing.',
        'Avoid water stress during crown root initiation and grain filling.',
        'Inspect leaves weekly for rust, yellowing, and aphid pressure.',
      ],
    };
  }

  return {
    intent,
    response: 'Healthy wheat management starts with correct sowing time, clean seed, balanced nutrients, and fast action when symptoms appear.',
    actionItems: ['Share crop stage and farm size for more specific advice.', 'Add a crop photo if leaves or stems look abnormal.'],
  };
}

function mockDiagnosis(payload: DiagnosePayload): DiagnosisResult {
  return {
    disease: payload.imageUri ? 'Possible yellow rust' : 'Symptom review needed',
    confidence: payload.imageUri ? 0.78 : 0.55,
    symptoms: ['Yellowing streaks on leaves', 'Patchy field appearance', 'Reduced leaf vigor'],
    treatmentSteps: [
      'Isolate heavily affected patches for close monitoring.',
      'Consult a local extension officer for fungicide selection and dosage.',
      'Improve airflow and avoid over-irrigation until symptoms stabilize.',
    ],
    recommendation: 'Treat this as a high-priority wheat health check and compare symptoms with nearby fields within 48 hours.',
    intent: 'DISEASE',
  };
}

export async function askWheaty(payload: AskPayload): Promise<AdviceResult> {
  const remote = await request<AdviceResult>('/ask', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return remote ?? mockAdvice(payload);
}

export async function diagnoseCrop(payload: DiagnosePayload): Promise<DiagnosisResult> {
  const remote = await request<DiagnosisResult>('/diagnose', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return remote ?? mockDiagnosis(payload);
}

export async function saveRecord(record: HistoryRecord): Promise<HistoryRecord> {
  await request<HistoryRecord>('/records', {
    method: 'POST',
    body: JSON.stringify({ userId: record.userId, type: record.type, data: record }),
  });

  const current = await getHistory(record.userId);
  const next = [record, ...current.filter((item) => item.id !== record.id)].slice(0, 50);
  await writeJson(HISTORY_KEY, next);
  return record;
}

export async function getHistory(userId: string, limit = 20): Promise<HistoryRecord[]> {
  const remote = await request<HistoryRecord[]>(`/history?userId=${encodeURIComponent(userId)}&limit=${limit}`, {
    method: 'GET',
  });
  if (remote) return remote;

  const local = await readJson<HistoryRecord[]>(HISTORY_KEY, []);
  return local.filter((item) => item.userId === userId).slice(0, limit);
}

export async function saveFarmProfile(profile: FarmProfile): Promise<FarmProfile> {
  const remote = await request<FarmProfile>('/farm-profile', {
    method: 'POST',
    body: JSON.stringify(profile),
  });
  const saved = remote ?? profile;
  await writeJson(PROFILE_KEY, saved);
  return saved;
}

export async function getFarmProfile(userId: string): Promise<FarmProfile | null> {
  const local = await readJson<FarmProfile | null>(PROFILE_KEY, null);
  return local?.userId === userId ? local : null;
}
