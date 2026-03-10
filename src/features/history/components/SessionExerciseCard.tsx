import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { bestSessionE1RM } from '../utils/epley';
import { DeltaIndicator } from './DeltaIndicator';
import { SetRow } from './SetRow';
import type { HistoryExercise, ExerciseDelta } from '../types';

interface SessionExerciseCardProps {
  exercise: HistoryExercise;
  delta?: ExerciseDelta;
  onDeleteSet: (setId: string, sessionExerciseId: string) => void;
}

export function SessionExerciseCard({
  exercise,
  delta,
  onDeleteSet,
}: SessionExerciseCardProps) {
  const showE1RM = exercise.exercise.track_prs && exercise.set_logs.length > 0;
  const e1rm = showE1RM ? bestSessionE1RM(exercise.set_logs) : 0;

  return (
    <Card>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <Text style={s.exerciseName}>{exercise.exercise.name}</Text>
          <View style={s.badgeRow}>
            {exercise.exercise.muscle_groups.map((mg) => (
              <View key={mg} style={s.muscleBadge}>
                <Text style={s.muscleBadgeText}>{mg}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.headerRight}>
          {showE1RM && e1rm > 0 && (
            <Text style={s.e1rmText}>Est. 1RM: {e1rm} kg</Text>
          )}
          {delta && <DeltaIndicator delta={delta} />}
        </View>
      </View>

      {/* Set Rows */}
      {exercise.set_logs.map((set) => (
        <SetRow
          key={set.id}
          set={set}
          sessionExerciseId={exercise.id}
          onDeleteSet={onDeleteSet}
        />
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  muscleBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  muscleBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  e1rmText: {
    color: colors.accentBright,
    fontSize: 12,
    fontWeight: '600',
  },
});
