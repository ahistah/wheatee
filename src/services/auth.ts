import { Language, User } from '../types';

const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const TOKEN_REFRESH_SKEW_MS = 5 * 60 * 1000;
const AUTH_DISABLED = process.env.EXPO_PUBLIC_ENABLE_FIREBASE_AUTH !== '1';

type FirebaseAuthResponse = {
  idToken: string;
  email: string;
  refreshToken: string;
  localId: string;
  displayName?: string;
  expiresIn?: string;
};

type FirebaseRefreshResponse = {
  id_token: string;
  refresh_token: string;
  user_id: string;
  expires_in: string;
};

type FirebaseAuthError = {
  error?: {
    message?: string;
  };
};

function firebaseUrl(action: 'signInWithPassword' | 'signUp') {
  return `https://identitytoolkit.googleapis.com/v1/accounts:${action}?key=${FIREBASE_API_KEY}`;
}

function expiresAt(expiresIn?: string) {
  return Date.now() + Number(expiresIn ?? 3600) * 1000;
}

async function firebaseAuth(action: 'signInWithPassword' | 'signUp', email: string, password: string, name: string) {
  const response = await fetch(firebaseUrl(action), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      displayName: name,
      returnSecureToken: true,
    }),
  });

  const json = (await response.json()) as FirebaseAuthResponse & FirebaseAuthError;
  if (!response.ok) {
    throw new Error(json.error?.message ?? 'Firebase authentication failed');
  }
  return json;
}

export async function authenticateUser(name: string, email: string, password: string, language: Language): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  if (AUTH_DISABLED || !FIREBASE_API_KEY) {
    return createAnonymousUser(name, normalizedEmail, language);
  }

  if (!normalizedEmail || !password) {
    throw new Error('Email and password are required for Firebase login.');
  }

  let result: FirebaseAuthResponse;
  try {
    result = await firebaseAuth('signInWithPassword', normalizedEmail, password, name);
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (!message.includes('EMAIL_NOT_FOUND') && !message.includes('INVALID_LOGIN_CREDENTIALS')) {
      throw error;
    }
    result = await firebaseAuth('signUp', normalizedEmail, password, name);
  }

  return {
    userId: result.localId,
    name: name.trim() || result.displayName || 'Wheat Farmer',
    phoneOrEmail: result.email,
    language,
    authProvider: 'firebase',
    idToken: result.idToken,
    refreshToken: result.refreshToken,
    idTokenExpiresAt: expiresAt(result.expiresIn),
  };
}

export function createAnonymousUser(name = 'Wheat Farmer', phoneOrEmail = 'local@wheatee.app', language: Language = 'en'): User {
  return {
    userId: 'anonymous-farmer',
    name: name.trim() || 'Wheat Farmer',
    phoneOrEmail: phoneOrEmail.trim().toLowerCase() || 'local@wheatee.app',
    language,
    authProvider: 'demo',
  };
}

export function isTokenFresh(user: User) {
  if (user.authProvider !== 'firebase') return true;
  return Boolean(user.idToken && user.idTokenExpiresAt && user.idTokenExpiresAt - TOKEN_REFRESH_SKEW_MS > Date.now());
}

export async function refreshFirebaseUser(user: User): Promise<User> {
  if (!FIREBASE_API_KEY || user.authProvider !== 'firebase' || !user.refreshToken) {
    return user;
  }

  if (isTokenFresh(user)) {
    return user;
  }

  const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: user.refreshToken,
    }).toString(),
  });

  const json = (await response.json()) as FirebaseRefreshResponse & FirebaseAuthError;
  if (!response.ok) {
    throw new Error(json.error?.message ?? 'Firebase token refresh failed');
  }

  return {
    ...user,
    userId: json.user_id || user.userId,
    idToken: json.id_token,
    refreshToken: json.refresh_token,
    idTokenExpiresAt: expiresAt(json.expires_in),
  };
}
