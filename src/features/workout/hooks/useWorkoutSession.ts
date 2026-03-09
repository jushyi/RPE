import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useAuthStore } from '@/stores/authStore';
import type { PlanDay } from '@/features/plans/types';
import type { Exercise } from '@/features/exercises/types';
import type { SessionExercise, SetLog } from '@/features/workout/types';

/** Generate a UUID v4 string */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Session lifecycle hook wrapping workoutStore with navigation and convenience methods.
 */
export function useWorkoutSession() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.userId);
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const currentExerciseIndex = useWorkoutStore((s) => s.currentExerciseIndex);
  const startPlanSession = useWorkoutStore((s) => s.startPlanSession);
  const startFreestyleSession = useWorkoutStore((s) => s.startFreestyleSession);
  const logSetAction = useWorkoutStore((s) => s.logSet);
  const addExerciseAction = useWorkoutStore((s) => s.addExercise);
  const finishSessionAction = useWorkoutStore((s) => s.finishSession);
  const setCurrentExerciseIndex = useWorkoutStore((s) => s.setCurrentExerciseIndex);

  const currentExercise = activeSession?.exercises[currentExerciseIndex] ?? null;
  const exerciseCount = activeSession?.exercises.length ?? 0;

  const startFromPlan = useCallback(
    (planDay: PlanDay) => {
      if (!userId) return;
      startPlanSession(planDay, userId);
      router.push('/workout' as any);
    },
    [userId, startPlanSession, router]
  );

  const startFreestyle = useCallback(() => {
    if (!userId) return;
    startFreestyleSession(userId);
    router.push('/workout' as any);
  }, [userId, startFreestyleSession, router]);

  const logCurrentSet = useCallback(
    (weight: number, reps: number, unit: 'kg' | 'lbs') => {
      if (!currentExercise) return;

      const setLog: Omit<SetLog, 'set_number'> = {
        id: generateId(),
        weight,
        reps,
        unit,
        is_pr: false,
        logged_at: new Date().toISOString(),
      };

      logSetAction(currentExercise.exercise_id, setLog);
    },
    [currentExercise, logSetAction]
  );

  const finishWorkout = useCallback(() => {
    const completed = finishSessionAction();
    if (completed) {
      router.replace('/workout/summary' as any);
    }
  }, [finishSessionAction, router]);

  const endEarly = useCallback(() => {
    if (!activeSession) return;

    const exercisesWithSets = activeSession.exercises.filter(
      (e) => e.logged_sets.length > 0
    ).length;
    const remaining = activeSession.exercises.length - exercisesWithSets;

    if (remaining > 0) {
      Alert.alert(
        'End Workout Early?',
        `You have ${remaining} exercise${remaining !== 1 ? 's' : ''} remaining. End anyway?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Workout',
            style: 'destructive',
            onPress: () => finishWorkout(),
          },
        ]
      );
    } else {
      finishWorkout();
    }
  }, [activeSession, finishWorkout]);

  const addFreestyleExercise = useCallback(
    (exercise: Exercise) => {
      const sessionExercise: SessionExercise = {
        id: generateId(),
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        sort_order: exerciseCount,
        target_sets: [],
        weight_progression: 'manual',
        unit: 'lbs',
        logged_sets: [],
      };
      addExerciseAction(sessionExercise);
      // Navigate to the new exercise page (will be at index = exerciseCount)
      setCurrentExerciseIndex(exerciseCount);
    },
    [exerciseCount, addExerciseAction, setCurrentExerciseIndex]
  );

  return {
    session: activeSession,
    currentExercise,
    exerciseCount,
    currentIndex: currentExerciseIndex,
    startFromPlan,
    startFreestyle,
    logCurrentSet,
    finishWorkout,
    endEarly,
    addFreestyleExercise,
  };
}
