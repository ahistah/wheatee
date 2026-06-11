import dotenv from 'dotenv';

if (process.env.WHEATY_SKIP_DOTENV !== '1') {
  dotenv.config();
}

const ignoreLocalCloudEnv = process.env.WHEATY_SKIP_DOTENV === '1' && process.env.NODE_ENV !== 'production';
const cloudEnvKeys = new Set([
  'MONGO_URI',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'VERTEX_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'GCS_BUCKET',
  'SPEECH_PROJECT_ID',
]);

function env(key: string) {
  if (ignoreLocalCloudEnv && cloudEnvKeys.has(key)) return undefined;
  return process.env[key];
}

export const config = {
  port: Number(env('PORT') ?? 8080),
  nodeEnv: env('NODE_ENV') ?? 'development',
  corsOrigin: env('CORS_ORIGIN') ?? '*',
  firebaseProjectId: env('FIREBASE_PROJECT_ID'),
  firebaseServiceAccountJson: env('FIREBASE_SERVICE_ACCOUNT_JSON'),
  enableFirebaseAuth: env('ENABLE_FIREBASE_AUTH') === '1',
  mongoUri: env('MONGO_URI'),
  mongoDbName: env('MONGO_DB_NAME') ?? 'wheatee',
  supabaseUrl: env('SUPABASE_URL'),
  supabaseServiceRoleKey: env('SUPABASE_SERVICE_ROLE_KEY'),
  vertexProjectId: env('VERTEX_PROJECT_ID'),
  vertexLocation: env('VERTEX_LOCATION') ?? 'us-central1',
  geminiModel: env('GEMINI_MODEL') ?? 'gemini-3-flash',
  speechProjectId: env('SPEECH_PROJECT_ID') ?? env('VERTEX_PROJECT_ID'),
  speechLocation: env('SPEECH_LOCATION') ?? 'global',
  speechRecognizer: env('SPEECH_RECOGNIZER') ?? '_',
  speechModel: env('SPEECH_MODEL') ?? 'chirp_3',
  speechLanguageCodes: (env('SPEECH_LANGUAGE_CODES') ?? 'ur-PK,en-US')
    .split(',')
    .map((code: string) => code.trim())
    .filter(Boolean),
  gcsBucket: env('GCS_BUCKET'),
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
  return Boolean(config.enableFirebaseAuth && config.firebaseServiceAccountJson);
}

export function isStorageConfigured() {
  return Boolean(config.gcsBucket);
}

export function allowFallbacks() {
  return config.nodeEnv !== 'production';
}

export function missingProductionConfig() {
  return [
    ['MONGO_URI', config.mongoUri],
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
