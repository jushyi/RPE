import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { SetCard } from './SetCard';
import { PreviousPerformanceDisplay } from './PreviousPerformance';
import { PRCelebration } from './PRCelebration';
import type { SessionExercise, SetLog } from '@/features/workout/types';
import type { PRResult } from '@/features/workout/hooks/usePRDetection';

interface ExercisePageProps {
  exercise: SessionExercise;
  onLogSet: (exerciseId: string, weight: number, reps: number, unit: 'kg' | 'lbs') => void;
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
    async (weight: number, reps: number) => {
      // Check for PR before logging the set
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
      onLogSet(exercise.exercise_id, weight, reps, exercise.unit);
    },
    [exercise.exercise_id, exercise.exercise_name, exercise.unit, onLogSet, onDetectPR]
  );

  // For plan-based: show target_sets count of cards, minus already logged
  // For freestyle: show one active card, new one after logging
  const remainingSets = isPlanBased
    ? Math.max(exercise.target_sets.length - loggedCount, 0)
    : 1;

  const activeSetCards = [];
  for (let i = 0; i < remainingSets; i++) {
    const targetSetIndex = loggedCount + i;
    const targetSet = isPlanBased ? exercise.target_sets[targetSetIndex] : undefined;
    activeSetCards.push(
      <SetCard
        key={`active-${targetSetIndex}`}
        targetSet={targetSet}
        setNumber={loggedCount + i + 1}
        unit={exercise.unit}
        onLog={handleLog}
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
              ? `${exercise.target_sets.length} sets planned`
              : 'Add sets'}
          </Text>
        </View>

        {/* Previous performance inline display */}
        <PreviousPerformanceDisplay exerciseId={exercise.exercise_id} />

        {/* Active set cards */}
        {activeSetCards}

        {/* Logged sets (completed, read-only) */}
        {exercise.logged_sets.length > 0 && (
          <View style={s.loggedSection}>
            <Text style={s.loggedLabel}>Completed</Text>
            {exercise.logged_sets.map((setLog: SetLog) => (
              <View
                key={setLog.id}
                style={[s.loggedRow, setLog.is_pr && s.loggedRowPR]}
              >
                <View style={s.loggedRowLeft}>
                  <Text style={s.loggedSetNumber}>Set {setLog.set_number}</Text>
                  {setLog.is_pr && <Text style={s.prBadge}>PR</Text>}
                </View>
                <Text style={s.loggedValue}>
                  {setLog.weight} {setLog.unit} x {setLog.reps} reps
                </Text>
              </View>
            ))}
          </View>
        )}
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
  loggedSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  loggedLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loggedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  loggedRowPR: {
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    paddingLeft: 8,
  },
  loggedRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loggedSetNumber: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  prBadge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loggedValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
