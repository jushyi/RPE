import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useAuthStore } from '@/stores/authStore';
import { usePlanStore } from '@/stores/planStore';
import { setCompletedSession, setIsFinishing, isWorkoutFinishing } from '@/features/workout/workoutSessionBridge';
import { saveCompletedSession } from '@/features/workout/hooks/useCompletedToday';
import { cancelTodaysNudges } from '@/features/alarms/hooks/useAlarmScheduler';
import { enqueueVideoUpload, flushVideoQueue } from '@/features/videos/utils/videoUploadQueue';
import { notifyCoachWorkoutComplete } from '@/features/coaching/utils/notifyCoach';
import { enqueueCompletedSession, flushSyncQueue } from '@/features/workout/hooks/useSyncQueue';
import { supabase } from '@/lib/supabase/client';
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
  const discardSessionAction = useWorkoutStore((s) => s.discardSession);

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
    (weight: number, reps: number, unit: 'kg' | 'lbs', rpe: number | null = null) => {
      if (!currentExercise) return;

      const setLog: Omit<SetLog, 'set_number'> = {
        id: generateId(),
        weight,
        reps,
        rpe,
        unit,
        is_pr: false,
        logged_at: new Date().toISOString(),
      };

      logSetAction(currentExercise.id, setLog);
    },
    [currentExercise, logSetAction]
  );

  const finishWorkout = useCallback(() => {
    if (isWorkoutFinishing()) return; // Guard against double-tap
    try {
      setIsFinishing(true);
      console.log('finishWorkout: calling finishSessionAction');
      const completed = finishSessionAction();
      console.log('finishWorkout: finishSessionAction returned', completed ? 'session' : 'null');

      if (completed) {
        setCompletedSession(completed);
        saveCompletedSession(completed);

        // Enqueue DB sync immediately (don't rely on summary screen mounting)
        try {
          enqueueCompletedSession(completed);
          // Flush session sync first, THEN flush video queue (videos need set_logs to exist)
          flushSyncQueue(supabase)
            .then(() => {
              console.log('[Video] Session synced, flushing video queue');
              return flushVideoQueue();
            })
            .catch((err) => console.warn('finishWorkout: sync/video flush error:', err));
        } catch (err) {
          console.warn('finishWorkout: failed to enqueue session sync:', err);
        }

        // Fire-and-forget: cancel today's nudge so user doesn't get reminded after training
        try {
          const plans = usePlanStore.getState().plans;
          const jsDay = new Date().getDay();
          const todayWeekday = (jsDay + 6) % 7; // Convert to 0=Mon..6=Sun
          cancelTodaysNudges(plans, todayWeekday);
        } catch (_) {
          // Nudge cancel failure should not block workout save
        }

        // Fire-and-forget: notify coaches that trainee completed a workout
        const userName = useAuthStore.getState().displayName;
        const sessionHadPR = completed.exercises.some((e) =>
          e.logged_sets.some((s) => s.is_pr)
        );
        notifyCoachWorkoutComplete(
          completed.user_id,
          userName,
          completed.title,
          sessionHadPR
        ).catch(() => {});

        console.log('finishWorkout: navigating to summary');
        router.replace('/workout/summary' as any);

        // Safety fallback: if navigation doesn't fire within 500ms, retry
        setTimeout(() => {
          if (isWorkoutFinishing()) {
            console.warn('finishWorkout: navigation may have stalled, retrying');
            router.replace('/workout/summary' as any);
          }
        }, 500);
      } else {
        setIsFinishing(false);
      }
    } catch (error) {
      console.error('finishWorkout failed:', error);
      setIsFinishing(false);
      Alert.alert('Error', 'Failed to save workout. Please try again.');
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

  const cancelWorkout = useCallback(() => {
    Alert.alert(
      'Cancel Workout?',
      'All progress for this workout will be lost.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Cancel Workout',
          style: 'destructive',
          onPress: () => {
            discardSessionAction();
          },
        },
      ]
    );
  }, [discardSessionAction, router]);

  const addFreestyleExercise = useCallback(
    (exercise: Exercise) => {
      const sessionExercise: SessionExercise = {
        id: generateId(),
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        sort_order: exerciseCount,
        target_sets: [],
        weight_progression: 'manual',
        unit: useAuthStore.getState().preferredUnit,
        logged_sets: [],
      };
      addExerciseAction(sessionExercise);
      // Navigate to the new exercise page (will be at index = exerciseCount)
      setCurrentExerciseIndex(exerciseCount);
    },
    [exerciseCount, addExerciseAction, setCurrentExerciseIndex]
  );

  const attachVideoToSet = useCallback(
    async (exerciseId: string, setLogId: string, localUri: string, thumbnailUri: string, source?: 'camera' | 'gallery') => {
      if (!userId) {
        console.warn('[Video] No userId, skipping video attach');
        return;
      }
      console.log('[Video] attachVideoToSet called:', { exerciseId, setLogId, localUri, source });
      // Enqueue for upload — don't flush yet, set_logs may not exist in Supabase.
      // flushVideoQueue is called after session sync in finishWorkout.
      try {
        await enqueueVideoUpload({
          setLogId,
          userId,
          localUri,
          thumbnailUri,
          createdAt: new Date().toISOString(),
          source,
        });
      } catch (err: any) {
        const msg = err?.message || 'Failed to save video';
        console.warn('[Video] enqueueVideoUpload failed:', msg);
        Alert.alert('Video Error', msg);
      }
    },
    [userId],
  );

  const removeVideoFromSet = useCallback(
    (_exerciseId: string, _setLogId: string) => {
      // Video deletion from storage is handled by SetCard via useVideoUpload.deleteVideo
      // This callback allows the session hook to clear any local state if needed in the future
    },
    [],
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
    cancelWorkout,
    addFreestyleExercise,
    attachVideoToSet,
    removeVideoFromSet,
  };
}
