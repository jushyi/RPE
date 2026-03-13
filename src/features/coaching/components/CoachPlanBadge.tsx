import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

export function CoachPlanBadge() {
  return (
    <View style={s.badge}>
      <Ionicons name="fitness-outline" size={12} color={colors.accent} />
      <Text style={s.text}>Coach</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.accent + '18',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.accent,
  },
});
