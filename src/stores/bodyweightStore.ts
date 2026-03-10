import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { BodyweightEntry } from '@/features/progress/types';

const storage = createMMKV({ id: 'bodyweight-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface BodyweightState {
  entries: BodyweightEntry[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface BodyweightActions {
  setEntries: (entries: BodyweightEntry[]) => void;
  addEntry: (entry: BodyweightEntry) => void;
  removeEntry: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useBodyweightStore = create<BodyweightState & BodyweightActions>()(
  persist(
    (set) => ({
      // State
      entries: [],
      isLoading: false,
      lastFetched: null,

      // Actions
      setEntries: (entries) => set({ entries, lastFetched: Date.now() }),
      addEntry: (entry) =>
        set((s) => ({ entries: [entry, ...s.entries] })),
      removeEntry: (id) =>
        set((s) => ({
          entries: s.entries.filter((e) => e.id !== id),
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'bodyweight-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
