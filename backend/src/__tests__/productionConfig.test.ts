import { afterEach, describe, expect, test } from 'bun:test';

const managedEnvKeys = [
  'NODE_ENV',
  'MONGO_URI',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FIREBASE_SERVICE_ACCOUNT_JSON',
  'VERTEX_PROJECT_ID',
  'GCS_BUCKET',
  'SPEECH_PROJECT_ID',
];

const originalEnv = new Map(managedEnvKeys.map((key) => [key, process.env[key]]));

afterEach(() => {
  for (const key of managedEnvKeys) {
    const original = originalEnv.get(key);
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
});

async function importConfigWithEnv(env: Record<string, string | undefined>) {
  for (const key of managedEnvKeys) {
    delete process.env[key];
  }
  Object.entries(env).forEach(([key, value]) => {
    if (value !== undefined) {
      process.env[key] = value;
    }
  });

  return import(`../config.js?case=${crypto.randomUUID()}`);
}

describe('production configuration gates', () => {
  test('rejects production startup when cloud services are missing', async () => {
    const { validateProductionConfig } = await importConfigWithEnv({ NODE_ENV: 'production' });

    expect(() => validateProductionConfig()).toThrow(
      'Missing production configuration: MONGO_URI, VERTEX_PROJECT_ID, GCS_BUCKET, SPEECH_PROJECT_ID or VERTEX_PROJECT_ID',
    );
  });

  test('accepts production startup when required services are configured', async () => {
    const { allowFallbacks, validateProductionConfig } = await importConfigWithEnv({
      NODE_ENV: 'production',
      MONGO_URI: 'mongodb+srv://example.mongodb.net/wheatee',
      VERTEX_PROJECT_ID: 'wheatee-prod',
      GCS_BUCKET: 'wheatee-crop-images',
    });

    expect(allowFallbacks()).toBe(false);
    expect(() => validateProductionConfig()).not.toThrow();
  });

  test('allows local development without production cloud credentials', async () => {
    const { allowFallbacks, validateProductionConfig } = await importConfigWithEnv({
      NODE_ENV: 'development',
    });

    expect(allowFallbacks()).toBe(true);
    expect(() => validateProductionConfig()).not.toThrow();
  });
});
