import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { CoachingRelationship, TraineeProfile } from '@/features/coaching/types';

// Named MMKV instance to avoid colliding with other stores
const storage = createMMKV({ id: 'coaching-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface CoachingState {
  relationships: CoachingRelationship[];
  trainees: TraineeProfile[];
  coaches: TraineeProfile[];
  isLoading: boolean;
}

interface CoachingActions {
  setRelationships: (relationships: CoachingRelationship[]) => void;
  addRelationship: (relationship: CoachingRelationship) => void;
  removeRelationship: (id: string) => void;
  setTrainees: (trainees: TraineeProfile[]) => void;
  setCoaches: (coaches: TraineeProfile[]) => void;
  setLoading: (loading: boolean) => void;
}

export const useCoachingStore = create<CoachingState & CoachingActions>()(
  persist(
    (set) => ({
      // State
      relationships: [],
      trainees: [],
      coaches: [],
      isLoading: false,

      // Actions
      setRelationships: (relationships) => set({ relationships }),
      addRelationship: (relationship) =>
        set((s) => ({ relationships: [...s.relationships, relationship] })),
      removeRelationship: (id) =>
        set((s) => ({
          relationships: s.relationships.filter((r) => r.id !== id),
        })),
      setTrainees: (trainees) => set({ trainees }),
      setCoaches: (coaches) => set({ coaches }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'coaching-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
