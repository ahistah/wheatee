import { describe, expect, test } from 'bun:test';
import type { Request, Response } from 'express';

import { assertUserAccess, optionalAuth } from '../middleware/auth.js';

function requestWithVerifiedUser(userId?: string) {
  return {
    res: {
      locals: {
        userId,
      },
    } as Partial<Response>,
  } as Request;
}

describe('auth ownership checks', () => {
  test('allows local unauthenticated development requests', () => {
    expect(() => assertUserAccess(requestWithVerifiedUser(undefined), 'farmer-a')).not.toThrow();
  });

  test('allows matching Firebase userId', () => {
    expect(() => assertUserAccess(requestWithVerifiedUser('farmer-a'), 'farmer-a')).not.toThrow();
  });

  test('rejects cross-farmer access after Firebase verification', () => {
    expect(() => assertUserAccess(requestWithVerifiedUser('farmer-a'), 'farmer-b')).toThrow('Authenticated user cannot access another farmer record');
  });

  test('skips Firebase auth for public operational endpoints', async () => {
    const req = { path: '/health' } as Request;
    const res = {} as Response;
    let nextCalled = false;

    await optionalAuth(req, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });
});
