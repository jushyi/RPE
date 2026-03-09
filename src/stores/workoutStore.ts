import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createMMKV } from 'react-native-mmkv';
import type { WorkoutSession, SessionExercise, SetLog } from '@/features/workout/types';
import type { PlanDay } from '@/features/plans/types';

/** Generate a UUID v4 string */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Named MMKV instance for workout session persistence
const storage = createMMKV({ id: 'workout-storage' });

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => { storage.remove(name); },
};

interface WorkoutState {
  activeSession: WorkoutSession | null;
  currentExerciseIndex: number;
}

interface WorkoutActions {
  startSession: (session: WorkoutSession) => void;
  startPlanSession: (planDay: PlanDay, userId: string) => void;
  startFreestyleSession: (userId: string) => void;
  logSet: (exerciseId: string, setLog: Omit<SetLog, 'set_number'>) => void;
  addExercise: (exercise: SessionExercise) => void;
  removeExercise: (exerciseId: string) => void;
  reorderExercises: (exercises: SessionExercise[]) => void;
  setCurrentExerciseIndex: (index: number) => void;
  finishSession: () => WorkoutSession | null;
  discardSession: () => void;
}

export const useWorkoutStore = create<WorkoutState & WorkoutActions>()(
  persist(
    (set, get) => ({
      // State
      activeSession: null,
      currentExerciseIndex: 0,

      // Actions
      startSession: (session) =>
        set({ activeSession: session, currentExerciseIndex: 0 }),

      startPlanSession: (planDay, userId) => {
        const session: WorkoutSession = {
          id: generateId(),
          user_id: userId,
          plan_id: planDay.plan_id,
          plan_day_id: planDay.id,
          started_at: new Date().toISOString(),
          ended_at: null,
          exercises: planDay.plan_day_exercises.map((pde, index) => ({
            id: generateId(),
            exercise_id: pde.exercise_id,
            exercise_name: pde.exercise?.name ?? 'Unknown Exercise',
            sort_order: index,
            target_sets: pde.target_sets,
            weight_progression: pde.weight_progression,
            unit: (pde.unit_override ?? 'lbs') as 'kg' | 'lbs',
            logged_sets: [],
          })),
        };
        set({ activeSession: session, currentExerciseIndex: 0 });
      },

      startFreestyleSession: (userId) => {
        const session: WorkoutSession = {
          id: generateId(),
          user_id: userId,
          plan_id: null,
          plan_day_id: null,
          started_at: new Date().toISOString(),
          ended_at: null,
          exercises: [],
        };
        set({ activeSession: session, currentExerciseIndex: 0 });
      },

      logSet: (exerciseId, setLog) => {
        const { activeSession } = get();
        if (!activeSession) return;

        const exerciseIndex = activeSession.exercises.findIndex(
          (e) => e.exercise_id === exerciseId
        );
        if (exerciseIndex === -1) return;

        const exercise = activeSession.exercises[exerciseIndex];
        const setNumber = exercise.logged_sets.length + 1;

        const newSet: SetLog = {
          ...setLog,
          set_number: setNumber,
        };

        const updatedExercises = [...activeSession.exercises];
        updatedExercises[exerciseIndex] = {
          ...exercise,
          logged_sets: [...exercise.logged_sets, newSet],
        };

        set({
          activeSession: {
            ...activeSession,
            exercises: updatedExercises,
          },
        });
      },

      addExercise: (exercise) => {
        const { activeSession } = get();
        if (!activeSession) return;

        set({
          activeSession: {
            ...activeSession,
            exercises: [...activeSession.exercises, exercise],
          },
        });
      },

      removeExercise: (exerciseId) => {
        const { activeSession } = get();
        if (!activeSession) return;

        set({
          activeSession: {
            ...activeSession,
            exercises: activeSession.exercises.filter(
              (e) => e.exercise_id !== exerciseId
            ),
          },
        });
      },

      reorderExercises: (exercises) => {
        const { activeSession } = get();
        if (!activeSession) return;

        set({
          activeSession: {
            ...activeSession,
            exercises,
          },
        });
      },

      setCurrentExerciseIndex: (index) =>
        set({ currentExerciseIndex: index }),

      finishSession: () => {
        const { activeSession } = get();
        if (!activeSession) return null;

        const completedSession: WorkoutSession = {
          ...activeSession,
          ended_at: new Date().toISOString(),
        };

        set({ activeSession: null, currentExerciseIndex: 0 });
        return completedSession;
      },

      discardSession: () =>
        set({ activeSession: null, currentExerciseIndex: 0 }),
    }),
    {
      name: 'workout-storage',
      version: 1,
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
