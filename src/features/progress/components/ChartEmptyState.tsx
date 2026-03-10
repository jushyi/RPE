import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export function ChartEmptyState() {
  return (
    <View style={s.container}>
      <Ionicons name="analytics-outline" size={48} color={colors.textMuted} />
      <Text style={s.title}>No workout data yet</Text>
      <Text style={s.subtitle}>
        Log workouts with this exercise to see progress
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  title: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
});
