import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Button } from '@/components/ui/Button';

interface HistoryEmptyStateProps {
  onStartWorkout: () => void;
}

export function HistoryEmptyState({ onStartWorkout }: HistoryEmptyStateProps) {
  return (
    <View style={s.container}>
      <Ionicons name="time-outline" size={64} color={colors.textMuted} />
      <Text style={s.title}>No workouts yet</Text>
      <Text style={s.subtitle}>
        Complete a workout to see your history here.
      </Text>
      <View style={s.buttonWrapper}>
        <Button title="Start a Workout" onPress={onStartWorkout} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonWrapper: {
    width: '100%',
    maxWidth: 240,
  },
});
