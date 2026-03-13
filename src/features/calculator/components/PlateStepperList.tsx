import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import {
  PLATE_COLORS_LB,
  PLATE_COLORS_KG,
} from '@/features/calculator/constants/plates';

interface PlateStepperListProps {
  enabledPlates: number[];
  plateCounts: Record<number, number>;
  unit: 'kg' | 'lbs';
  onIncrement: (weight: number) => void;
  onDecrement: (weight: number) => void;
}

export function PlateStepperList({
  enabledPlates,
  plateCounts,
  unit,
  onIncrement,
  onDecrement,
}: PlateStepperListProps) {
  const plateColors = unit === 'kg' ? PLATE_COLORS_KG : PLATE_COLORS_LB;
  const unitLabel = unit === 'kg' ? 'kg' : 'lb';
  // Sort descending by weight
  const sorted = [...enabledPlates].sort((a, b) => b - a);

  return (
    <View style={s.container}>
      {sorted.map((weight) => {
        const count = plateCounts[weight] || 0;
        const chipColor = plateColors[weight] ?? '#666';
        // Use dark text on light-colored chips
        const chipTextColor =
          [10, 25, 15, 35].includes(weight) && unit === 'lbs'
            ? '#000'
            : [5, 10, 15].includes(weight) && unit === 'kg'
              ? '#000'
              : '#fff';

        return (
          <View key={weight} style={s.row}>
            {/* Colored plate chip */}
            <View style={[s.chip, { backgroundColor: chipColor }]}>
              <Text style={[s.chipText, { color: chipTextColor }]}>
                {weight} {unitLabel}
              </Text>
            </View>

            {/* Stepper controls */}
            <View style={s.stepperGroup}>
              <Pressable
                onPress={() => onDecrement(weight)}
                disabled={count === 0}
                hitSlop={8}
              >
                <Ionicons
                  name="remove-circle-outline"
                  size={32}
                  color={count === 0 ? colors.textMuted : colors.accent}
                />
              </Pressable>

              <Text style={s.countText}>{count}</Text>

              <Pressable onPress={() => onIncrement(weight)} hitSlop={8}>
                <Ionicons
                  name="add-circle-outline"
                  size={32}
                  color={colors.accent}
                />
              </Pressable>
            </View>
          </View>
        );
      })}

      <Text style={s.note}>Counts are per side</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 72,
    alignItems: 'center',
  },
  chipText: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepperGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countText: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    minWidth: 28,
    textAlign: 'center',
  },
  note: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});
