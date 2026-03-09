/**
 * Inline display of previous session's set data for an exercise.
 * Shown above set cards so users see their last numbers while logging.
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { usePreviousPerformance } from '@/features/workout/hooks/usePreviousPerformance';

interface PreviousPerformanceProps {
  exerciseId: string;
}

export function PreviousPerformanceDisplay({
  exerciseId,
}: PreviousPerformanceProps) {
  const { previousSets } = usePreviousPerformance(exerciseId);

  if (!previousSets) {
    return (
      <View style={s.container}>
        <Text style={s.firstTime}>First time logging this exercise</Text>
      </View>
    );
  }

  // Format date for display
  const dateLabel = formatSessionDate(previousSets.session_date);

  return (
    <View style={s.container}>
      <Text style={s.header}>Last session ({dateLabel}):</Text>
      {previousSets.sets.map((set, index) => (
        <Text key={set.id || index} style={s.setValue}>
          Set {set.set_number}: {set.weight} {set.unit} x {set.reps}
        </Text>
      ))}
    </View>
  );
}

function formatSessionDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  header: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  setValue: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  firstTime: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
