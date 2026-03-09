import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { Exercise } from '../types';
import { isCustomExercise } from '../types';
import { MuscleGroupBadge } from './MuscleGroupBadge';
import { EquipmentBadge } from './EquipmentBadge';

interface ExerciseListItemProps {
  exercise: Exercise;
  onPress?: () => void;
}

export const ExerciseListItem = React.memo(function ExerciseListItem({ exercise, onPress }: ExerciseListItemProps) {
  const groups = exercise.muscle_groups ?? ((exercise as any).muscle_group ? [(exercise as any).muscle_group] : []);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.container, pressed && s.pressed]}
    >
      <Text style={s.name}>{exercise.name}</Text>
      <View style={s.badges}>
        {groups.map((group: string) => (
          <MuscleGroupBadge key={group} muscleGroup={group as any} />
        ))}
        <EquipmentBadge equipment={exercise.equipment} />
        {isCustomExercise(exercise) && (
          <View style={s.customBadge}>
            <Text style={s.customText}>Custom</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  customBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    fontStyle: 'italic',
  },
});
