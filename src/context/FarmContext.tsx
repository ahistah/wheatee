import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getFarmProfile, saveFarmProfile } from '../services/api';
import { FarmProfile } from '../types';
import { useAuth } from './AuthContext';

type FarmContextValue = {
  farmProfile: FarmProfile | null;
  loading: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  updateProfile: (profile: FarmProfile) => Promise<void>;
  clearProfile: () => void;
};

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

export function FarmProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setFarmProfile(null);
      setError(null);
      return;
    }
    setLoading(true);
    try {
      setFarmProfile(await getFarmProfile(user.userId));
      setError(null);
    } catch {
      setError('Could not load farm profile from the backend.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const value = useMemo<FarmContextValue>(
    () => ({
      farmProfile,
      loading,
      error,
      refreshProfile,
      clearProfile: () => {
        setFarmProfile(null);
        setError(null);
      },
      updateProfile: async (profile) => {
        const saved = await saveFarmProfile(profile);
        setFarmProfile(saved);
        setError(null);
      },
    }),
    [error, farmProfile, loading, refreshProfile],
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) throw new Error('useFarm must be used within FarmProvider');
  return context;
}
