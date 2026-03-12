import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { ExercisePerformance } from '@/features/coaching/hooks/useTraineePerformance';

interface InlinePerformanceProps {
  data: ExercisePerformance | undefined;
}

/**
 * Displays trainee's last-week performance data inline next to plan targets.
 * Shows "Last week: 80kg x 10 (3 sets)" or "No recent data".
 */
export function InlinePerformance({ data }: InlinePerformanceProps) {
  if (!data) {
    return <Text style={s.noData}>No recent data</Text>;
  }

  return (
    <Text style={s.text}>
      Last week: {data.bestWeight}
      {data.unit} x {data.bestReps} ({data.totalSets} sets)
    </Text>
  );
}

const s = StyleSheet.create({
  text: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  noData: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.6,
    marginTop: 2,
  },
});
