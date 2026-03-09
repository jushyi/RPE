import { Text, View, StyleSheet } from 'react-native';
import type { MuscleGroup } from '../types';
import { MUSCLE_GROUP_COLORS } from '../constants/muscleGroups';

interface MuscleGroupBadgeProps {
  muscleGroup: MuscleGroup;
}

export function MuscleGroupBadge({ muscleGroup }: MuscleGroupBadgeProps) {
  const color = MUSCLE_GROUP_COLORS[muscleGroup];

  return (
    <View style={[s.badge, { backgroundColor: color + '33' }]}>
      <Text style={[s.text, { color }]}>{muscleGroup}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
