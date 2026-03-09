import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { Exercise } from '../types';
import { isCustomExercise } from '../types';
import { MuscleGroupBadge } from './MuscleGroupBadge';
import { EquipmentBadge } from './EquipmentBadge';

interface ExerciseListItemProps {
  exercise: Exercise;
  onLongPress?: () => void;
}

export function ExerciseListItem({ exercise, onLongPress }: ExerciseListItemProps) {
  return (
    <Pressable
      onLongPress={onLongPress}
      style={({ pressed }) => [s.container, pressed && s.pressed]}
    >
      <Text style={s.name}>{exercise.name}</Text>
      <View style={s.badges}>
        <MuscleGroupBadge muscleGroup={exercise.muscle_group} />
        <EquipmentBadge equipment={exercise.equipment} />
        {isCustomExercise(exercise) && (
          <View style={s.customBadge}>
            <Text style={s.customText}>Custom</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

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
    gap: 8,
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
