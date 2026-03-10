import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { Exercise } from '../types';
import { isCustomExercise } from '../types';
import { MuscleGroupBadge } from './MuscleGroupBadge';
import { EquipmentBadge } from './EquipmentBadge';

interface ExerciseListItemProps {
  exercise: Exercise;
  onPress?: () => void;
  showChartIcon?: boolean;
}

export const ExerciseListItem = React.memo(function ExerciseListItem({
  exercise,
  onPress,
  showChartIcon = true,
}: ExerciseListItemProps) {
  const router = useRouter();
  const groups = exercise.muscle_groups ?? ((exercise as any).muscle_group ? [(exercise as any).muscle_group] : []);

  const handleChartPress = () => {
    router.push({
      pathname: '/(app)/progress/[exerciseId]' as any,
      params: { exerciseId: exercise.id, exerciseName: exercise.name },
    });
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [s.container, pressed && s.pressed]}
    >
      <View style={s.row}>
        <View style={s.content}>
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
        </View>
        {showChartIcon && (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleChartPress();
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={s.chartBtn}
          >
            <Ionicons name="stats-chart-outline" size={20} color={colors.textMuted} />
          </Pressable>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
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
  chartBtn: {
    paddingLeft: 12,
    paddingVertical: 4,
  },
});
