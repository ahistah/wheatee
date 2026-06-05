import { afterAll, beforeAll, describe, expect, test } from 'bun:test';
import type { Server } from 'node:http';

import { createApp } from '../app.js';
import { closeDatabase, seedKnowledgeBase } from '../services/database.js';

let server: Server;
let baseUrl: string;

async function request<T>(path: string, init?: RequestInit): Promise<{ status: number; body: T }> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  return {
    status: response.status,
    body: (await response.json()) as T,
  };
}

beforeAll(async () => {
  server = createApp().listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Could not bind test server');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await closeDatabase();
});

describe('Wheaty API', () => {
  test('reports backend readiness', async () => {
    const response = await request<{
      ok: boolean;
      ready: boolean;
      service: string;
      mode: string;
      environment: string;
      supabase: boolean;
      firebase: boolean;
      storage: boolean;
      speech: boolean;
      knowledgeBase: number;
      missingConfig: string[];
    }>('/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.ready).toBe(false);
    expect(response.body.service).toBe('wheaty-api');
    expect(response.body.mode).toBe('fallback');
    expect(typeof response.body.environment).toBe('string');
    expect(response.body.supabase).toBe(false);
    expect(response.body.firebase).toBe(false);
    expect(response.body.storage).toBe(false);
    expect(response.body.speech).toBe(false);
    expect(response.body.knowledgeBase).toBeGreaterThanOrEqual(5);
    expect(response.body.missingConfig).toEqual([]);
  });

  test('serves seeded knowledge base records', async () => {
    const response = await request<Array<{ id: string; category: string; actionItems: string[] }>>('/knowledge-base');

    expect(response.status).toBe(200);
    expect(response.body.some((record) => record.id === 'wheat-yellow-rust')).toBe(true);
    expect(response.body.some((record) => record.category === 'YIELD_ADVICE' && record.actionItems.length > 0)).toBe(true);
  });

  test('seeds knowledge base for configured persistence layer', async () => {
    const result = await seedKnowledgeBase();

    expect(result.seeded).toBeGreaterThanOrEqual(5);
    expect(['memory', 'mongo', 'supabase']).toContain(result.mode);
  });

  test('saves and retrieves a farm profile', async () => {
    const boundaryGeoJson = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [73.0419, 31.5174],
              [73.0539, 31.5174],
              [73.0539, 31.5234],
              [73.0419, 31.5234],
              [73.0419, 31.5174],
            ]],
          },
        },
      ],
    };
    const payload = {
      userId: 'test-farmer',
      farmSize: '10 kanal',
      cropTypes: ['wheat'],
      soilType: 'loam',
      irrigationType: 'canal',
      location: 'Punjab',
      boundaryGeoJson,
      centerLat: 31.5204,
      centerLng: 73.0479,
      areaHectares: 0.81,
      areaKanal: 16.01,
    };

    const saved = await request<typeof payload>('/farm-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const fetched = await request<typeof payload>('/farm-profile?userId=test-farmer');

    expect(saved.status).toBe(200);
    expect(saved.body).toEqual(payload);
    expect(fetched.status).toBe(200);
    expect(fetched.body.farmSize).toBe('10 kanal');
    expect(fetched.body.boundaryGeoJson).toEqual(boundaryGeoJson);
    expect(fetched.body.areaKanal).toBe(16.01);
  });

  test('routes yield, planning, memory, and disease workflows', async () => {
    const yieldAdvice = await request<{ intent: string; response: string; actionItems: string[] }>('/ask', {
      method: 'POST',
      body: JSON.stringify({ userId: 'intent-farmer', text: 'How much fertilizer for wheat?' }),
    });
    const plan = await request<{ intent: string; actionItems: string[] }>('/ask', {
      method: 'POST',
      body: JSON.stringify({ userId: 'intent-farmer', text: 'Organize my 10 kanal farm for irrigation' }),
    });
    const memory = await request<{ intent: string; response: string }>('/ask', {
      method: 'POST',
      body: JSON.stringify({ userId: 'intent-farmer', text: 'Show previous diseases' }),
    });
    const disease = await request<{ intent: string; response: string }>('/ask', {
      method: 'POST',
      body: JSON.stringify({ userId: 'intent-farmer', text: 'Leaves are yellow with rust spots' }),
    });

    expect(yieldAdvice.status).toBe(200);
    expect(yieldAdvice.body.intent).toBe('YIELD_ADVICE');
    expect(yieldAdvice.body.response).toContain('balanced');
    expect(yieldAdvice.body.actionItems.length).toBeGreaterThan(0);
    expect(plan.body.intent).toBe('FARM_PLANNING');
    expect(memory.body.intent).toBe('MEMORY_QUERY');
    expect(disease.body.intent).toBe('DISEASE');
  });

  test('diagnoses and persists crop image workflow records', async () => {
    const diagnosis = await request<{ intent: string; confidence: number; treatmentSteps: string[] }>('/diagnose', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'diagnosis-farmer',
        text: 'Leaves are yellow in patches',
        imageBase64: Buffer.from('fake-image').toString('base64'),
        imageMimeType: 'image/jpeg',
      }),
    });
    const history = await request<Array<{ intent: string; type: string; confidence?: number }>>('/history?userId=diagnosis-farmer&limit=5');

    expect(diagnosis.status).toBe(200);
    expect(diagnosis.body.intent).toBe('DISEASE');
    expect(diagnosis.body.confidence).toBeGreaterThan(0);
    expect(diagnosis.body.treatmentSteps.length).toBeGreaterThan(0);
    expect(history.body.some((record) => record.type === 'diagnosis' && record.intent === 'DISEASE')).toBe(true);
  });

  test('deletes farmer profile and memory data', async () => {
    const userId = 'delete-farmer';
    await request('/farm-profile', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        farmSize: '8 kanal',
        cropTypes: ['wheat'],
        soilType: 'loam',
        irrigationType: 'canal',
        location: 'Punjab',
      }),
    });
    await request('/records', {
      method: 'POST',
      body: JSON.stringify({
        userId,
        type: 'conversation',
        data: {
          id: 'delete-conversation',
          userId,
          type: 'conversation',
          input: 'How much fertilizer?',
          response: 'Use split fertilizer doses.',
          intent: 'YIELD_ADVICE',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    const deleted = await request<{
      userId: string;
      farmProfilesDeleted: number;
      diagnosesDeleted: number;
      conversationsDeleted: number;
    }>(`/account-data?userId=${userId}`, { method: 'DELETE' });
    const profile = await request(`/farm-profile?userId=${userId}`);
    const history = await request<unknown[]>(`/history?userId=${userId}`);

    expect(deleted.status).toBe(200);
    expect(deleted.body.userId).toBe(userId);
    expect(deleted.body.farmProfilesDeleted).toBe(1);
    expect(deleted.body.conversationsDeleted).toBe(1);
    expect(profile.body).toBeNull();
    expect(history.body).toEqual([]);
  });

  test('accepts voice-only ask requests with speech fallback text', async () => {
    const response = await request<{ intent: string; response: string }>('/ask', {
      method: 'POST',
      body: JSON.stringify({
        userId: 'voice-farmer',
        audioBase64: Buffer.from('fake-audio').toString('base64'),
        audioMimeType: 'audio/m4a',
      }),
    });

    expect(response.status).toBe(200);
    expect(response.body.response).toContain('Voice input received');
  });

  test('rejects invalid records payloads', async () => {
    const response = await request<{ error: string }>('/records', {
      method: 'POST',
      body: JSON.stringify({ userId: '', type: 'unknown', data: {} }),
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid request payload');
  });
});
