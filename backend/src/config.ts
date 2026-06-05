import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 8080),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
  mongoUri: process.env.MONGO_URI,
  mongoDbName: process.env.MONGO_DB_NAME ?? 'wheaty',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  vertexProjectId: process.env.VERTEX_PROJECT_ID,
  vertexLocation: process.env.VERTEX_LOCATION ?? 'us-central1',
  geminiModel: process.env.GEMINI_MODEL ?? 'gemini-3-flash',
  speechProjectId: process.env.SPEECH_PROJECT_ID ?? process.env.VERTEX_PROJECT_ID,
  speechLocation: process.env.SPEECH_LOCATION ?? 'global',
  speechRecognizer: process.env.SPEECH_RECOGNIZER ?? '_',
  speechModel: process.env.SPEECH_MODEL ?? 'chirp_3',
  speechLanguageCodes: (process.env.SPEECH_LANGUAGE_CODES ?? 'ur-PK,en-US')
    .split(',')
    .map((code: string) => code.trim())
    .filter(Boolean),
  gcsBucket: process.env.GCS_BUCKET,
};

export function isAiConfigured() {
  return Boolean(config.vertexProjectId);
}

export function isSpeechConfigured() {
  return Boolean(config.speechProjectId);
}

export function isSupabaseConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey);
}

export function isFirebaseConfigured() {
  return Boolean(config.firebaseServiceAccountJson);
}

export function isStorageConfigured() {
  return Boolean(config.gcsBucket);
}

export function allowFallbacks() {
  return config.nodeEnv !== 'production';
}

export function missingProductionConfig() {
  return [
    ['SUPABASE_URL', config.supabaseUrl],
    ['SUPABASE_SERVICE_ROLE_KEY', config.supabaseServiceRoleKey],
    ['FIREBASE_SERVICE_ACCOUNT_JSON', config.firebaseServiceAccountJson],
    ['VERTEX_PROJECT_ID', config.vertexProjectId],
    ['GCS_BUCKET', config.gcsBucket],
    ['SPEECH_PROJECT_ID or VERTEX_PROJECT_ID', config.speechProjectId],
  ].filter(([, value]) => !value).map(([key]) => key);
}

export function validateProductionConfig() {
  if (allowFallbacks()) return;

  const missing = missingProductionConfig();

  if (missing.length) {
    throw new Error(`Missing production configuration: ${missing.join(', ')}`);
  }
}
