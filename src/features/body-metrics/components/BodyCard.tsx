import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { colors } from '@/constants/theme';
import { useBodyweightData } from '@/features/progress/hooks/useBodyweightData';
import { useBodyMeasurements } from '../hooks/useBodyMeasurements';
import { Sparkline } from '@/features/progress/components/Sparkline';

/**
 * Combined Body dashboard card showing latest bodyweight, latest measurements,
 * and a bodyweight sparkline. Tapping navigates to the body-metrics detail screen.
 */
export function BodyCard() {
  const router = useRouter();
  const {
    latest: latestWeight,
    sparklineData,
    fetchEntries: fetchBodyweight,
  } = useBodyweightData();
  const {
    latestByMetric,
    fetchMeasurements,
  } = useBodyMeasurements();

  useFocusEffect(
    useCallback(() => {
      fetchBodyweight();
      fetchMeasurements();
    }, [fetchBodyweight, fetchMeasurements])
  );

  const hasData = latestWeight || latestByMetric;

  const handlePress = () => {
    router.push('/(app)/body-metrics' as any);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
    >
      <Card title="Body">
        {!hasData ? (
          <Text style={s.emptyText}>Log your first measurement</Text>
        ) : (
          <View>
            {/* Bodyweight row with sparkline */}
            <View style={s.weightRow}>
              <View style={s.weightDisplay}>
                <Text style={s.weightValue}>
                  {latestWeight ? String(latestWeight.weight) : '--'}
                </Text>
                <Text style={s.weightUnit}>
                  {latestWeight?.unit ?? 'lbs'}
                </Text>
              </View>
              <Sparkline
                data={sparklineData}
                color={colors.accent}
                width={80}
                height={32}
              />
            </View>

            {/* Measurement rows */}
            {latestByMetric && (
              <View style={s.measurementSection}>
                {latestByMetric.chest != null && (
                  <View style={s.measurementRow}>
                    <Text style={s.measurementLabel}>Chest</Text>
                    <Text style={s.measurementValue}>
                      {latestByMetric.chest} {latestByMetric.chest_unit}
                    </Text>
                  </View>
                )}
                {latestByMetric.waist != null && (
                  <View style={s.measurementRow}>
                    <Text style={s.measurementLabel}>Waist</Text>
                    <Text style={s.measurementValue}>
                      {latestByMetric.waist} {latestByMetric.waist_unit}
                    </Text>
                  </View>
                )}
                {latestByMetric.biceps != null && (
                  <View style={s.measurementRow}>
                    <Text style={s.measurementLabel}>Biceps</Text>
                    <Text style={s.measurementValue}>
                      {latestByMetric.biceps} {latestByMetric.biceps_unit}
                    </Text>
                  </View>
                )}
                {latestByMetric.quad != null && (
                  <View style={s.measurementRow}>
                    <Text style={s.measurementLabel}>Quad</Text>
                    <Text style={s.measurementValue}>
                      {latestByMetric.quad} {latestByMetric.quad_unit}
                    </Text>
                  </View>
                )}
                {latestByMetric.body_fat_pct != null && (
                  <View style={s.measurementRow}>
                    <Text style={s.measurementLabel}>Body Fat</Text>
                    <Text style={s.measurementValue}>
                      {latestByMetric.body_fat_pct}%
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </Card>
    </Pressable>
  );
}

const s = StyleSheet.create({
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  weightValue: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  weightUnit: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  measurementSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    paddingTop: 10,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  measurementLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  measurementValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
