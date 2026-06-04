import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getFarmProfile, saveFarmProfile } from '../services/api';
import { FarmProfile } from '../types';
import { useAuth } from './AuthContext';

type FarmContextValue = {
  farmProfile: FarmProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (profile: FarmProfile) => Promise<void>;
};

const FarmContext = createContext<FarmContextValue | undefined>(undefined);

export function FarmProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [farmProfile, setFarmProfile] = useState<FarmProfile | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!user) {
      setFarmProfile(null);
      return;
    }
    setLoading(true);
    try {
      setFarmProfile(await getFarmProfile(user.userId));
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
      refreshProfile,
      updateProfile: async (profile) => {
        const saved = await saveFarmProfile(profile);
        setFarmProfile(saved);
      },
    }),
    [farmProfile, loading, refreshProfile],
  );

  return <FarmContext.Provider value={value}>{children}</FarmContext.Provider>;
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (!context) throw new Error('useFarm must be used within FarmProvider');
  return context;
}
