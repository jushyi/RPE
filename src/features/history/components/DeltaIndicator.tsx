import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { ExerciseDelta } from '../types';

interface DeltaIndicatorProps {
  delta: ExerciseDelta;
}

export function DeltaIndicator({ delta }: DeltaIndicatorProps) {
  if (!delta.hasPrevious) return null;

  return (
    <View style={s.container}>
      <DeltaValue value={delta.weightDelta} suffix="kg" />
      <DeltaValue value={delta.repsDelta} suffix="reps" />
    </View>
  );
}

function DeltaValue({ value, suffix }: { value: number; suffix: string }) {
  if (value > 0) {
    return (
      <View style={s.pill}>
        <Ionicons name="arrow-up" size={12} color={colors.success} />
        <Text style={[s.text, { color: colors.success }]}>
          +{value} {suffix}
        </Text>
      </View>
    );
  }

  if (value < 0) {
    return (
      <View style={s.pill}>
        <Ionicons name="arrow-down" size={12} color={colors.error} />
        <Text style={[s.text, { color: colors.error }]}>
          {value} {suffix}
        </Text>
      </View>
    );
  }

  return (
    <View style={s.pill}>
      <Text style={[s.text, { color: colors.textMuted }]}>= {suffix}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
});
