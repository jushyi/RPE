/**
 * Post-workout session summary stats card.
 * Displays duration, total volume, exercises completed, and PRs hit in a 2x2 grid.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { WorkoutSession, SessionSummary as SessionSummaryType } from '@/features/workout/types';

interface Props {
  session: WorkoutSession;
}

/** Compute summary statistics from a completed workout session */
export function computeSessionSummary(session: WorkoutSession): SessionSummaryType {
  const startedAt = new Date(session.started_at).getTime();
  const endedAt = session.ended_at
    ? new Date(session.ended_at).getTime()
    : Date.now();
  const duration_minutes = Math.round((endedAt - startedAt) / 60000);

  let total_volume = 0;
  let prs_hit = 0;
  let exercises_completed = 0;
  const exercises_with_manual_progression: SessionSummaryType['exercises_with_manual_progression'] = [];

  for (const exercise of session.exercises) {
    if (exercise.logged_sets.length > 0) {
      exercises_completed++;
    }

    for (const set of exercise.logged_sets) {
      total_volume += set.weight * set.reps;
      if (set.is_pr) {
        prs_hit++;
      }
    }

    if (
      exercise.weight_progression === 'manual' &&
      exercise.logged_sets.length > 0
    ) {
      const lastSet = exercise.logged_sets[exercise.logged_sets.length - 1];
      exercises_with_manual_progression.push({
        exercise_id: exercise.exercise_id,
        exercise_name: exercise.exercise_name,
        last_weight: lastSet.weight,
        unit: exercise.unit,
      });
    }
  }

  return {
    duration_minutes,
    total_volume,
    exercises_completed,
    prs_hit,
    exercises_with_manual_progression,
  };
}

/** Format volume with K suffix for large numbers */
function formatVolume(volume: number): string {
  if (volume >= 10000) {
    return `${(volume / 1000).toFixed(1)}K`;
  }
  return volume.toLocaleString();
}

export default function SessionSummaryCard({ session }: Props) {
  const summary = computeSessionSummary(session);

  return (
    <View style={s.container}>
      <Text style={s.title}>Session Stats</Text>
      <View style={s.grid}>
        <View style={s.statBox}>
          <Ionicons name="time-outline" size={24} color={colors.accent} />
          <Text style={s.statValue}>{summary.duration_minutes}</Text>
          <Text style={s.statLabel}>Minutes</Text>
        </View>
        <View style={s.statBox}>
          <Ionicons name="barbell-outline" size={24} color={colors.accent} />
          <Text style={s.statValue}>{formatVolume(summary.total_volume)}</Text>
          <Text style={s.statLabel}>Volume (lbs)</Text>
        </View>
        <View style={s.statBox}>
          <Ionicons name="list-outline" size={24} color={colors.accent} />
          <Text style={s.statValue}>{summary.exercises_completed}</Text>
          <Text style={s.statLabel}>Exercises</Text>
        </View>
        <View style={s.statBox}>
          <Ionicons name="trophy-outline" size={24} color={colors.warning} />
          <Text style={s.statValue}>{summary.prs_hit}</Text>
          <Text style={s.statLabel}>PRs</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    width: '47%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});
