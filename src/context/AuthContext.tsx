import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { Language, User } from '../types';
import { authenticateUser, refreshFirebaseUser } from '../services/auth';
import { readJson, removeItem, writeJson } from '../utils/storage';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (name: string, phoneOrEmail: string, password: string, language: Language) => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<User | null>;
};

const AUTH_KEY = 'wheaty.user';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJson<User | null>(AUTH_KEY, null)
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (name, phoneOrEmail, password, language) => {
        const nextUser = await authenticateUser(name, phoneOrEmail, password, language);
        await writeJson(AUTH_KEY, nextUser);
        setUser(nextUser);
      },
      signOut: async () => {
        await removeItem(AUTH_KEY);
        setUser(null);
      },
      refreshSession: async () => {
        if (!user) return null;
        const refreshed = await refreshFirebaseUser(user);
        await writeJson(AUTH_KEY, refreshed);
        setUser(refreshed);
        return refreshed;
      },
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
