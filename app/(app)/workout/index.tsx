import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import PagerView from 'react-native-pager-view';
import { colors } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { useAuthStore } from '@/stores/authStore';
import { useWorkoutSession } from '@/features/workout/hooks/useWorkoutSession';
import { isWorkoutFinishing } from '@/features/workout/workoutSessionBridge';
import { usePRDetection } from '@/features/workout/hooks/usePRDetection';
import { WorkoutHeader } from '@/features/workout/components/WorkoutHeader';
import { ExercisePager } from '@/features/workout/components/ExercisePager';
import { FreestyleExercisePicker } from '@/features/workout/components/FreestyleExercisePicker';
import type { Exercise } from '@/features/exercises/types';

export default function WorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ plan_day_id?: string }>();
  const activeSession = useWorkoutStore((s) => s.activeSession);
  const userId = useAuthStore((s) => s.userId);
  const { detectPR, loadBaselines } = usePRDetection(userId ?? undefined);
  const {
    session,
    currentExercise,
    exerciseCount,
    currentIndex,
    logCurrentSet,
    finishWorkout,
    endEarly,
    addFreestyleExercise,
  } = useWorkoutSession();

  const pickerRef = useRef<BottomSheetModal>(null);
  const pagerRef = useRef<PagerView>(null);

  // If no active session and no plan_day_id, redirect back
  // Skip if we're intentionally finishing (navigating to summary)
  useEffect(() => {
    if (!activeSession && !params.plan_day_id && !isWorkoutFinishing()) {
      router.back();
    }
  }, [activeSession, params.plan_day_id]);

  // Load PR baselines when workout starts
  useEffect(() => {
    loadBaselines();
  }, [loadBaselines]);

  const handleLogSet = useCallback(
    (exerciseId: string, weight: number, reps: number, rpe: number | null, unit: 'kg' | 'lbs', isPR: boolean) => {
      const store = useWorkoutStore.getState();
      store.logSet(exerciseId, {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        weight,
        reps,
        rpe,
        unit,
        is_pr: isPR,
        logged_at: new Date().toISOString(),
      });
    },
    []
  );

  const handleAddExercise = useCallback(
    (exercise: Exercise) => {
      addFreestyleExercise(exercise);
      // Navigate to the newly added exercise after a brief delay
      setTimeout(() => {
        pagerRef.current?.setPage(exerciseCount);
      }, 100);
    },
    [addFreestyleExercise, exerciseCount]
  );

  const openPicker = useCallback(() => {
    pickerRef.current?.present();
  }, []);

  if (!session) {
    return <View style={s.container} />;
  }

  const loggedSetsCount = currentExercise?.logged_sets.length ?? 0;
  const targetSetsCount = currentExercise?.target_sets.length ?? 0;
  const totalSets = targetSetsCount > 0 ? targetSetsCount : Math.max(loggedSetsCount + 1, 1);
  const currentSetNumber = Math.min(loggedSetsCount + 1, totalSets);

  const exercisesWithSets = session.exercises.filter(
    (e) => e.logged_sets.length > 0
  ).length;
  const hasExercisesRemaining = exercisesWithSets < session.exercises.length;

  const isFreestyle = session.plan_id === null;

  return (
    <BottomSheetModalProvider>
      <SafeAreaView style={s.container} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={s.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {currentExercise && (
            <WorkoutHeader
              exerciseName={currentExercise.exercise_name}
              currentSetNumber={currentSetNumber}
              totalSets={totalSets}
              hasExercisesRemaining={hasExercisesRemaining}
              onEndWorkout={endEarly}
              onFinishWorkout={finishWorkout}
              sessionTitle={session.title}
            />
          )}

          {exerciseCount > 0 ? (
            <ExercisePager
              exercises={session.exercises}
              onLogSet={handleLogSet}
              onDetectPR={detectPR}
              pagerRef={pagerRef}
            />
          ) : (
            <View style={s.emptyContainer}>
              <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
              {session.title ? (
                <Text style={s.emptyTitle}>{session.title}</Text>
              ) : null}
            </View>
          )}

          {/* FAB for freestyle exercise picker */}
          {isFreestyle && (
            <Pressable
              onPress={openPicker}
              style={({ pressed }) => [s.fab, pressed && s.fabPressed]}
            >
              <Ionicons name="add" size={28} color="#ffffff" />
            </Pressable>
          )}
        </KeyboardAvoidingView>

        <FreestyleExercisePicker
          ref={pickerRef}
          onSelect={handleAddExercise}
        />
      </SafeAreaView>
    </BottomSheetModalProvider>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabPressed: {
    opacity: 0.8,
  },
});
