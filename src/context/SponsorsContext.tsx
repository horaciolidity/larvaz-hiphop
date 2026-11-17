'use client';

import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useApp } from './AppContext';
import { sponsorsStore, isAdminActor } from '@/lib/sponsors/store';
import type { SponsorActor, SponsorsState } from '@/types/sponsors';

interface SponsorsContextType {
  state: SponsorsState;
  store: typeof sponsorsStore;
  actor: SponsorActor | null;
  isAdmin: boolean;
  canManage: (brandId: string) => boolean;
}

const SponsorsContext = createContext<SponsorsContextType | null>(null);

export function SponsorsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  const state = useSyncExternalStore(
    sponsorsStore.subscribe,
    sponsorsStore.getSnapshot,
    sponsorsStore.getServerSnapshot
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sponsorsStore.hydrateFromStorage();
    const handler = () => sponsorsStore.refreshFromStorage();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const actor = useMemo<SponsorActor | null>(() => {
    if (!currentUser) return null;
    return {
      id: currentUser.id,
      username: currentUser.username,
      full_name: currentUser.full_name,
      avatar_url: currentUser.avatar_url,
      role: currentUser.role,
      is_guest: Boolean(currentUser.is_guest || currentUser.id === 'user-guest'),
      location: currentUser.location,
    };
  }, [currentUser]);

  const isAdmin = isAdminActor(actor);

  const value = useMemo<SponsorsContextType>(
    () => ({
      state,
      store: sponsorsStore,
      actor,
      isAdmin,
      canManage: (brandId: string) => sponsorsStore.canManageBrand(actor, brandId),
    }),
    [state, actor, isAdmin]
  );

  return <SponsorsContext.Provider value={value}>{children}</SponsorsContext.Provider>;
}

export function useSponsors(): SponsorsContextType {
  const ctx = useContext(SponsorsContext);
  if (!ctx) {
    throw new Error('useSponsors debe usarse dentro de <SponsorsProvider>');
  }
  return ctx;
}
