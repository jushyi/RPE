import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { colors } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import type { SessionExercise } from '@/features/workout/types';

interface ExercisePagerProps {
  exercises: SessionExercise[];
  onLogSet: (exerciseId: string, weight: number, reps: number, unit: 'kg' | 'lbs') => void;
  pagerRef: React.RefObject<PagerView | null>;
}

/**
 * Stub ExercisePager - full implementation in Task 2.
 */
export function ExercisePager({ exercises, onLogSet, pagerRef }: ExercisePagerProps) {
  const currentIndex = useWorkoutStore((s) => s.currentExerciseIndex);
  const setCurrentExerciseIndex = useWorkoutStore((s) => s.setCurrentExerciseIndex);

  return (
    <View style={s.container}>
      <PagerView
        ref={pagerRef}
        style={s.pager}
        initialPage={0}
        onPageSelected={(e) => setCurrentExerciseIndex(e.nativeEvent.position)}
        key={exercises.length}
      >
        {exercises.map((exercise) => (
          <View key={exercise.id} style={s.page}>
            <Text style={s.exerciseName}>{exercise.exercise_name}</Text>
          </View>
        ))}
      </PagerView>
      {/* Progress dots */}
      <View style={s.dotsContainer}>
        {exercises.map((_, index) => (
          <View
            key={index}
            style={[s.dot, index === currentIndex ? s.dotActive : s.dotInactive]}
          />
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.accent,
  },
  dotInactive: {
    backgroundColor: colors.surfaceElevated,
  },
});
