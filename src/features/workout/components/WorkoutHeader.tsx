import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface WorkoutHeaderProps {
  exerciseName: string;
  currentSetNumber: number;
  totalSets: number;
  hasExercisesRemaining: boolean;
  onEndWorkout: () => void;
  onFinishWorkout: () => void;
  onCancelWorkout: () => void;
  sessionTitle?: string;
  isFinishing?: boolean;
}

export function WorkoutHeader({
  exerciseName,
  currentSetNumber,
  totalSets,
  hasExercisesRemaining,
  onEndWorkout,
  onFinishWorkout,
  onCancelWorkout,
  sessionTitle,
  isFinishing = false,
}: WorkoutHeaderProps) {
  return (
    <View style={s.container}>
      <Pressable onPress={onCancelWorkout} style={s.cancelButton}>
        <Ionicons name="close-outline" size={24} color={colors.textSecondary} />
      </Pressable>
      <View style={s.titleContainer}>
        {sessionTitle ? (
          <Text style={s.sessionTitle} numberOfLines={1}>
            {sessionTitle}
          </Text>
        ) : null}
        <Text style={s.exerciseName} numberOfLines={1}>
          {exerciseName}
        </Text>
        <Text style={s.setProgress}>
          Set {currentSetNumber} of {totalSets}
        </Text>
      </View>
      <Pressable
        onPress={hasExercisesRemaining ? onEndWorkout : onFinishWorkout}
        disabled={isFinishing}
        style={({ pressed }) => [s.endButton, pressed && s.endButtonPressed, isFinishing && s.endButtonDisabled]}
      >
        <Ionicons name="stop-circle-outline" size={20} color={isFinishing ? colors.textSecondary : colors.error} />
        <Text style={[s.endButtonText, isFinishing && s.endButtonTextDisabled]}>
          {isFinishing ? 'Saving...' : hasExercisesRemaining ? 'End' : 'Finish'}
        </Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  cancelButton: {
    padding: 8,
    marginRight: 4,
  },
  titleContainer: {
    flex: 1,
    marginRight: 12,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  sessionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 2,
  },
  setProgress: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  endButtonPressed: {
    opacity: 0.7,
  },
  endButtonDisabled: {
    opacity: 0.5,
  },
  endButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  endButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
