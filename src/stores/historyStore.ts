import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { HistorySession } from '@/features/history/types';

// Named MMKV instance to avoid colliding with other stores
const storage = createMMKV({ id: 'history-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => {
    storage.remove(name);
  },
};

interface HistoryState {
  sessions: HistorySession[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface HistoryActions {
  setSessions: (sessions: HistorySession[]) => void;
  removeSession: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useHistoryStore = create<HistoryState & HistoryActions>()(
  persist(
    (set) => ({
      // State
      sessions: [],
      isLoading: false,
      lastFetched: null,

      // Actions
      setSessions: (sessions) => set({ sessions, lastFetched: Date.now() }),
      removeSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'history-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
