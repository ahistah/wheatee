import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { Language, User } from '../types';
import { readJson, removeItem, writeJson } from '../utils/storage';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (name: string, phoneOrEmail: string, language: Language) => Promise<void>;
  signOut: () => Promise<void>;
};

const AUTH_KEY = 'wheaty.user';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    readJson<User | null>(AUTH_KEY, null)
      .then(setUser)
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (name, phoneOrEmail, language) => {
        const nextUser: User = {
          userId: `farmer-${Date.now()}`,
          name: name.trim() || 'Wheat Farmer',
          phoneOrEmail: phoneOrEmail.trim() || 'demo@wheaty.app',
          language,
        };
        await writeJson(AUTH_KEY, nextUser);
        setUser(nextUser);
      },
      signOut: async () => {
        await removeItem(AUTH_KEY);
        setUser(null);
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
