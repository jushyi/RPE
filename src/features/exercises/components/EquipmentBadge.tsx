import { Text, View, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { Equipment } from '../types';

interface EquipmentBadgeProps {
  equipment: Equipment;
}

export function EquipmentBadge({ equipment }: EquipmentBadgeProps) {
  return (
    <View style={s.badge}>
      <Text style={s.text}>{equipment}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
