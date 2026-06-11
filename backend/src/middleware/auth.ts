import type { NextFunction, Request, Response } from 'express';
import admin from 'firebase-admin';

import { config } from '../config.js';

let firebaseReady = false;
const publicPaths = new Set(['/health', '/knowledge-base']);

function initFirebase() {
  if (firebaseReady || !config.enableFirebaseAuth || !config.firebaseServiceAccountJson) return;

  const credential = admin.credential.cert(JSON.parse(config.firebaseServiceAccountJson));
  admin.initializeApp({
    credential,
    projectId: config.firebaseProjectId,
  });
  firebaseReady = true;
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  if (publicPaths.has(req.path)) {
    next();
    return;
  }

  initFirebase();
  if (!firebaseReady) {
    next();
    return;
  }

  const header = req.header('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
  if (!token) {
    res.status(401).json({ error: 'Missing Firebase bearer token' });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    res.locals.userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
}

export function assertUserAccess(req: Request, userId: string) {
  const verifiedUserId = req.res?.locals.userId;
  if (verifiedUserId && verifiedUserId !== userId) {
    const error = new Error('Authenticated user cannot access another farmer record');
    error.name = 'ForbiddenError';
    throw error;
  }
}
