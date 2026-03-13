import React from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import { colors } from '@/constants/theme';
import { useWorkoutStore } from '@/stores/workoutStore';
import { ExercisePage } from './ExercisePage';
import type { SessionExercise } from '@/features/workout/types';
import type { PRResult } from '@/features/workout/hooks/usePRDetection';

interface ExercisePagerProps {
  exercises: SessionExercise[];
  onLogSet: (exerciseId: string, weight: number, reps: number, rpe: number | null, unit: 'kg' | 'lbs', isPR: boolean) => void;
  onDetectPR?: (exerciseId: string, weight: number, unit: 'kg' | 'lbs') => Promise<PRResult>;
  onRemoveExercise?: (exerciseId: string) => void;
  onVideoAttached?: (exerciseId: string, setLogId: string, localUri: string, thumbnailUri: string, source?: 'camera' | 'gallery') => void;
  onVideoDeleted?: (exerciseId: string, setLogId: string) => void;
  pagerRef: React.RefObject<PagerView | null>;
}

/**
 * PagerView wrapper providing horizontal exercise navigation with progress dots.
 * Each page renders an ExercisePage for one exercise.
 */
export function ExercisePager({ exercises, onLogSet, onDetectPR, onRemoveExercise, onVideoAttached, onVideoDeleted, pagerRef }: ExercisePagerProps) {
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
            <ExercisePage exercise={exercise} onLogSet={onLogSet} onDetectPR={onDetectPR} onRemove={onRemoveExercise} onVideoAttached={onVideoAttached} onVideoDeleted={onVideoDeleted} />
          </View>
        ))}
      </PagerView>

      {/* Progress dots */}
      {exercises.length > 1 && (
        <View style={s.dotsContainer}>
          {exercises.map((_, index) => (
            <View
              key={index}
              style={[s.dot, index === currentIndex ? s.dotActive : s.dotInactive]}
            />
          ))}
        </View>
      )}
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
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
