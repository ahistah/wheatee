import { AdviceResult, BackendStatus, DiagnosisResult, FarmProfile, HistoryRecord, Intent, User } from '../types';
import { refreshFirebaseUser } from './auth';
import { readJson, removeItem, writeJson } from '../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL;
const IS_PRODUCTION_APP = process.env.EXPO_PUBLIC_APP_ENV === 'production';
const REQUEST_TIMEOUT_MS = 20000;
const HISTORY_KEY = 'wheatee.history';
const PROFILE_KEY = 'wheatee.profile';
const AUTH_KEY = 'wheatee.user';

type AskPayload = {
  text: string;
  audioUri?: string;
  audioBase64?: string;
  audioMimeType?: string;
  userId: string;
  farmProfile?: FarmProfile | null;
};

type DiagnosePayload = {
  imageUri?: string;
  imageBase64?: string;
  imageMimeType?: string;
  audioUri?: string;
  audioBase64?: string;
  audioMimeType?: string;
  text?: string;
  userId: string;
};

async function request<T>(path: string, options: RequestInit): Promise<T | null> {
  if (!API_URL) {
    if (IS_PRODUCTION_APP) {
      throw new Error('Production app is missing EXPO_PUBLIC_API_URL.');
    }
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const authUser = await getValidAuthUser();
  if (authUser?.idToken) {
    headers.Authorization = `Bearer ${authUser.idToken}`;
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new Error(`API ${path} failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

async function getValidAuthUser() {
  const authUser = await readJson<User | null>(AUTH_KEY, null);
  if (!authUser) return null;

  try {
    const refreshed = await refreshFirebaseUser(authUser);
    if (refreshed !== authUser) {
      await writeJson(AUTH_KEY, refreshed);
    }
    return refreshed;
  } catch {
    return authUser;
  }
}

export function getBackendMode(): 'remote' | 'demo' {
  return API_URL ? 'remote' : 'demo';
}

export async function getBackendStatus(): Promise<BackendStatus> {
  if (!API_URL) {
    if (IS_PRODUCTION_APP) {
      return {
        mode: 'remote',
        reachable: false,
        message: 'Production app is missing EXPO_PUBLIC_API_URL.',
      };
    }
    return {
      mode: 'demo',
      reachable: true,
      message: 'Demo mode: local agronomist responses and farm memory are active.',
    };
  }

  try {
    const health = await request<{
      ok: boolean;
      ready: boolean;
      service: string;
      mode: 'ai' | 'fallback';
      mongo: boolean;
      supabase: boolean;
      firebase: boolean;
      storage: boolean;
      speech: boolean;
      knowledgeBase: number;
      missingConfig: string[];
    }>('/health', { method: 'GET' });
    const ready = health?.ready ?? false;
    const missingConfig = health?.missingConfig ?? [];
    return {
      mode: 'remote',
      baseUrl: API_URL,
      reachable: Boolean(health?.ok),
      ready,
      service: health?.service,
      ai: health?.mode === 'ai',
      mongo: health?.mongo,
      supabase: health?.supabase,
      firebase: health?.firebase,
      storage: health?.storage,
      speech: health?.speech,
      knowledgeBase: health?.knowledgeBase,
      missingConfig,
      message: ready
        ? 'Connected to production-ready Wheatee AI backend.'
        : missingConfig.length
          ? `Backend is reachable but missing: ${missingConfig.join(', ')}.`
          : health?.mode === 'ai'
            ? 'Connected to Wheatee AI backend.'
            : 'Connected to Wheatee backend in fallback mode.',
    };
  } catch {
    return {
      mode: 'remote',
      baseUrl: API_URL,
      reachable: false,
      message: IS_PRODUCTION_APP
        ? 'Backend is configured but not reachable. Check the deployed API before release.'
        : 'Backend is configured but not reachable. Local history still works.',
    };
  }
}
function detectIntent(text: string, hasImage = false): Intent {
  const lower = text.toLowerCase();
  if (/history|previous|last season|record|before|what happened|show previous|past/.test(lower)) return 'MEMORY_QUERY';
  if (hasImage || /yellow|leaf|rust|spot|disease symptom|fungus|infect|pest|blight|mildew/.test(lower)) return 'DISEASE';
  if (/fertilizer|yield|production|urea|dap|harvest|increase/.test(lower)) return 'YIELD_ADVICE';
  if (/plan|layout|kanal|acre|divide|irrigation|schedule|water/.test(lower)) return 'FARM_PLANNING';
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

export async function askWheatee(payload: AskPayload): Promise<AdviceResult> {
  const remote = await request<AdviceResult>('/ask', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (IS_PRODUCTION_APP && !remote) {
    throw new Error('Production advice requires the deployed Wheatee backend.');
  }
  return remote ?? mockAdvice(payload);
}

export async function diagnoseCrop(payload: DiagnosePayload): Promise<DiagnosisResult> {
  const remote = await request<DiagnosisResult>('/diagnose', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (IS_PRODUCTION_APP && !remote) {
    throw new Error('Production diagnosis requires the deployed Wheatee backend.');
  }
  return remote ?? mockDiagnosis(payload);
}

export function buildAdviceRecord(userId: string, input: string, result: AdviceResult): HistoryRecord {
  return {
    id: `record-${Date.now()}`,
    userId,
    type: result.intent === 'FARM_PLANNING' ? 'plan' : 'conversation',
    input,
    response: formatAdvice(result),
    intent: result.intent,
    timestamp: new Date().toISOString(),
    actionItems: result.actionItems,
    backendMode: getBackendMode(),
  };
}

export function buildDiagnosisRecord(
  userId: string,
  input: string,
  imageUri: string | undefined,
  result: DiagnosisResult,
): HistoryRecord {
  return {
    id: `diagnosis-${Date.now()}`,
    userId,
    type: 'diagnosis',
    input: input || 'Crop image diagnosis',
    response: formatDiagnosis(result),
    intent: result.intent,
    timestamp: new Date().toISOString(),
    imageUri,
    imageURL: result.imageURL,
    imageDisplayURL: result.imageDisplayURL,
    confidence: result.confidence,
    actionItems: result.treatmentSteps,
    backendMode: getBackendMode(),
  };
}

export function formatAdvice(result: AdviceResult): string {
  const actions = result.actionItems.length ? `\n\nAction plan\n${result.actionItems.map((item) => `- ${item}`).join('\n')}` : '';
  return `${result.response}${actions}`;
}

export function formatDiagnosis(result: DiagnosisResult): string {
  return [
    `${result.disease} (${Math.round(result.confidence * 100)}% confidence)`,
    `Visible symptoms\n${result.symptoms.map((item) => `- ${item}`).join('\n')}`,
    `Treatment steps\n${result.treatmentSteps.map((item) => `- ${item}`).join('\n')}`,
    result.recommendation,
  ].join('\n\n');
}

export async function saveRecord(record: HistoryRecord): Promise<HistoryRecord> {
  try {
    await request<HistoryRecord>('/records', {
      method: 'POST',
      body: JSON.stringify({ userId: record.userId, type: record.type, data: record }),
    });
  } catch (error) {
    if (IS_PRODUCTION_APP) {
      throw error;
    }
    // Keep the farmer's local memory even if the deployed backend is temporarily unavailable.
  }

  const current = await getHistory(record.userId);
  const next = [record, ...current.filter((item) => item.id !== record.id)].slice(0, 50);
  await writeJson(HISTORY_KEY, next);
  return record;
}

export async function getHistory(userId: string, limit = 20): Promise<HistoryRecord[]> {
  let remote: HistoryRecord[] | null = null;
  try {
    remote = await request<HistoryRecord[]>(`/history?userId=${encodeURIComponent(userId)}&limit=${limit}`, {
      method: 'GET',
    });
  } catch (error) {
    if (IS_PRODUCTION_APP) throw error;
    remote = null;
  }

  if (remote) {
    return remote;
  }

  const local = await readJson<HistoryRecord[]>(HISTORY_KEY, []);
  return local.filter((item) => item.userId === userId).slice(0, limit);
}

export async function saveFarmProfile(profile: FarmProfile): Promise<FarmProfile> {
  let remote: FarmProfile | null = null;
  try {
    remote = await request<FarmProfile>('/farm-profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    });
  } catch (error) {
    if (IS_PRODUCTION_APP) {
      throw error;
    }
    remote = null;
  }
  const saved = remote ?? profile;
  if (IS_PRODUCTION_APP && !remote) {
    throw new Error('Production profile save requires the deployed Wheatee backend.');
  }
  await writeJson(PROFILE_KEY, saved);
  return saved;
}

export async function getFarmProfile(userId: string): Promise<FarmProfile | null> {
  let receivedRemoteProfile = false;
  try {
    const remote = await request<FarmProfile | null>(`/farm-profile?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
    });
    receivedRemoteProfile = true;
    if (remote) {
      await writeJson(PROFILE_KEY, remote);
      return remote;
    }
  } catch (error) {
    if (IS_PRODUCTION_APP) {
      throw error;
    }
  }
  if (IS_PRODUCTION_APP && receivedRemoteProfile) {
    return null;
  }

  const local = await readJson<FarmProfile | null>(PROFILE_KEY, null);
  return local?.userId === userId ? local : null;
}

export async function deleteAccountData(userId: string) {
  const remote = await request<{
    userId: string;
    farmProfilesDeleted: number;
    diagnosesDeleted: number;
    conversationsDeleted: number;
    cropImagesDeleted: number;
  }>(`/account-data?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
  if (IS_PRODUCTION_APP && !remote) {
    throw new Error('Production data deletion requires the deployed Wheatee backend.');
  }
  await Promise.all([removeItem(PROFILE_KEY), removeItem(HISTORY_KEY)]);
  return remote ?? {
    userId,
    farmProfilesDeleted: 0,
    diagnosesDeleted: 0,
    conversationsDeleted: 0,
    cropImagesDeleted: 0,
  };
}
