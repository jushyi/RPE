import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useExerciseChartData } from '@/features/progress/hooks/useExerciseChartData';
import { ExerciseChart } from '@/features/progress/components/ExerciseChart';
import { ChartMetricTabs } from '@/features/progress/components/ChartMetricTabs';
import { ChartTimeRangeSelector } from '@/features/progress/components/ChartTimeRangeSelector';
import { ChartEmptyState } from '@/features/progress/components/ChartEmptyState';
import type { ChartMetric, TimeRange } from '@/features/progress/types';

export default function ExerciseChartScreen() {
  const { exerciseId, exerciseName } = useLocalSearchParams<{
    exerciseId: string;
    exerciseName?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('estimated_1rm');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('all');

  const { data, loading } = useExerciseChartData(exerciseId ?? '', selectedRange);

  const title = exerciseName || 'Exercise Progress';

  return (
    <View style={[s.safe, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.title} numberOfLines={1}>
          {title}
        </Text>
        <View style={s.headerSpacer} />
      </View>

      {/* Metric Tabs */}
      <ChartMetricTabs selected={selectedMetric} onSelect={setSelectedMetric} />

      {/* Chart Area */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : data.length === 0 ? (
        <ChartEmptyState />
      ) : data.length === 1 ? (
        <View style={s.singlePointContainer}>
          <Ionicons name="trending-up-outline" size={32} color={colors.textMuted} />
          <Text style={s.singlePointValue}>
            {selectedMetric === 'total_volume'
              ? `${data[0].total_volume.toLocaleString()} vol`
              : selectedMetric === 'max_weight'
                ? `${data[0].max_weight} lbs`
                : `${data[0].estimated_1rm} lbs`}
          </Text>
          <Text style={s.singlePointMessage}>
            Log more workouts to see a trend line
          </Text>
        </View>
      ) : (
        <ExerciseChart data={data as unknown as any[]} metric={selectedMetric} />
      )}

      {/* Time Range Selector */}
      <ChartTimeRangeSelector selected={selectedRange} onSelect={setSelectedRange} />
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  title: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginHorizontal: 8,
  },
  headerSpacer: {
    width: 32, // Balance the back button width
  },
  loadingContainer: {
    height: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singlePointContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  singlePointValue: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  singlePointMessage: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
