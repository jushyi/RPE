import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { SetCard } from './SetCard';
import { PreviousPerformanceDisplay } from './PreviousPerformance';
import { PRCelebration } from './PRCelebration';
import type { SessionExercise } from '@/features/workout/types';
import type { PRResult } from '@/features/workout/hooks/usePRDetection';

interface ExercisePageProps {
  exercise: SessionExercise;
  onLogSet: (exerciseId: string, weight: number, reps: number, rpe: number | null, unit: 'kg' | 'lbs', isPR: boolean) => void;
  onDetectPR?: (exerciseId: string, weight: number) => Promise<PRResult>;
}

interface CelebrationState {
  exerciseName: string;
  newWeight: number;
  previousBest: number | null;
  unit: string;
}

export function ExercisePage({ exercise, onLogSet, onDetectPR }: ExercisePageProps) {
  const isPlanBased = exercise.target_sets.length > 0;
  const loggedCount = exercise.logged_sets.length;
  const [celebration, setCelebration] = useState<CelebrationState | null>(null);

  const handleLog = useCallback(
    async (weight: number, reps: number, rpe: number | null) => {
      // Check for PR before logging
      let isPR = false;
      if (onDetectPR) {
        try {
          const result = await onDetectPR(exercise.exercise_id, weight);
          isPR = result.isPR;
          if (result.isPR) {
            setCelebration({
              exerciseName: exercise.exercise_name,
              newWeight: weight,
              previousBest: result.previousBest,
              unit: exercise.unit,
            });
          }
        } catch {
          // PR detection failure should not block logging
        }
      }
      onLogSet(exercise.id, weight, reps, rpe, exercise.unit, isPR);
    },
    [exercise.id, exercise.exercise_name, exercise.unit, onLogSet, onDetectPR]
  );

  // Always show all cards — plan-based shows target count, freestyle shows 3 minimum
  const totalSets = isPlanBased
    ? exercise.target_sets.length
    : Math.max(3, loggedCount + 1);

  const setCards = [];
  for (let i = 0; i < totalSets; i++) {
    const setNumber = i + 1;
    const targetSet = isPlanBased ? exercise.target_sets[i] : undefined;
    const isAlreadyLogged = exercise.logged_sets.some((s) => s.set_number === setNumber);

    setCards.push(
      <SetCard
        key={`set-${exercise.id}-${setNumber}`}
        targetSet={targetSet}
        setNumber={setNumber}
        unit={exercise.unit}
        onLog={handleLog}
        isLogged={isAlreadyLogged}
      />
    );
  }

  return (
    <View style={s.wrapper}>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <Text style={s.exerciseName}>{exercise.exercise_name}</Text>
          <Text style={s.setsInfo}>
            {isPlanBased
              ? `${loggedCount}/${exercise.target_sets.length} sets logged`
              : `${loggedCount} sets logged`}
          </Text>
        </View>

        {/* Previous performance inline display */}
        <PreviousPerformanceDisplay exerciseId={exercise.exercise_id} />

        {/* Set cards — always visible, marked as logged when filled */}
        {setCards}
      </ScrollView>

      {/* PR Celebration overlay */}
      {celebration && (
        <PRCelebration
          exerciseName={celebration.exerciseName}
          newWeight={celebration.newWeight}
          previousBest={celebration.previousBest}
          unit={celebration.unit}
          onDismiss={() => setCelebration(null)}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
    paddingBottom: 80,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
  },
  setsInfo: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
});
