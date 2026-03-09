import React, { useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { SetCard } from './SetCard';
import type { SessionExercise, SetLog } from '@/features/workout/types';

interface ExercisePageProps {
  exercise: SessionExercise;
  onLogSet: (exerciseId: string, weight: number, reps: number, unit: 'kg' | 'lbs') => void;
}

export function ExercisePage({ exercise, onLogSet }: ExercisePageProps) {
  const isPlanBased = exercise.target_sets.length > 0;
  const loggedCount = exercise.logged_sets.length;

  const handleLog = useCallback(
    (weight: number, reps: number) => {
      onLogSet(exercise.exercise_id, weight, reps, exercise.unit);
    },
    [exercise.exercise_id, exercise.unit, onLogSet]
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

      {/* Active set cards */}
      {activeSetCards}

      {/* Logged sets (completed, read-only) */}
      {exercise.logged_sets.length > 0 && (
        <View style={s.loggedSection}>
          <Text style={s.loggedLabel}>Completed</Text>
          {exercise.logged_sets.map((setLog: SetLog, index: number) => (
            <View key={setLog.id} style={s.loggedRow}>
              <Text style={s.loggedSetNumber}>Set {setLog.set_number}</Text>
              <Text style={s.loggedValue}>
                {setLog.weight} {setLog.unit} x {setLog.reps} reps
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
  loggedSetNumber: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  loggedValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
