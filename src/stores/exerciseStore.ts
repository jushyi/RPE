import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { Exercise } from '@/features/exercises/types';

// Named MMKV instance to avoid colliding with auth store's default instance
const storage = createMMKV({ id: 'exercise-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface ExerciseState {
  exercises: Exercise[];
  isLoading: boolean;
  lastFetched: number | null;
}

interface ExerciseActions {
  setExercises: (exercises: Exercise[]) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (id: string, updates: Partial<Exercise>) => void;
  removeExercise: (id: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useExerciseStore = create<ExerciseState & ExerciseActions>()(
  persist(
    (set) => ({
      // State
      exercises: [],
      isLoading: false,
      lastFetched: null,

      // Actions
      setExercises: (exercises) => set({ exercises, lastFetched: Date.now() }),
      addExercise: (exercise) =>
        set((s) => ({ exercises: [...s.exercises, exercise] })),
      updateExercise: (id, updates) =>
        set((s) => ({
          exercises: s.exercises.map((e) =>
            e.id === id ? { ...e, ...updates } : e
          ),
        })),
      removeExercise: (id) =>
        set((s) => ({
          exercises: s.exercises.filter((e) => e.id !== id),
        })),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'exercise-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
      migrate: (persisted: any, version: number) => {
        if (version === 0 && persisted?.state?.exercises) {
          // v0 → v1: muscle_group (string) → muscle_groups (string[])
          persisted.state.exercises = persisted.state.exercises.map((e: any) => {
            if (e.muscle_group && !e.muscle_groups) {
              return { ...e, muscle_groups: [e.muscle_group], muscle_group: undefined };
            }
            return e;
          });
        }
        return persisted;
      },
    }
  )
);
