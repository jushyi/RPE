import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import {
  PLATE_COLORS_LB,
  PLATE_COLORS_KG,
} from '@/features/calculator/constants/plates';

interface MyPlatesSectionProps {
  enabledPlates: number[];
  allPlates: number[];
  unit: 'kg' | 'lbs';
  onToggle: (weight: number) => void;
}

export function MyPlatesSection({
  enabledPlates,
  allPlates,
  unit,
  onToggle,
}: MyPlatesSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const plateColors = unit === 'kg' ? PLATE_COLORS_KG : PLATE_COLORS_LB;
  const unitLabel = unit === 'kg' ? 'kg' : 'lb';
  const enabledSet = new Set(enabledPlates);
  const allEnabled = enabledPlates.length === allPlates.length;

  const summaryText = allEnabled
    ? 'All plates enabled'
    : `${enabledPlates.length} of ${allPlates.length} enabled`;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <View style={s.container}>
      <Pressable style={s.header} onPress={toggle}>
        <Text style={s.label}>My Plates</Text>
        <View style={s.valueRow}>
          <Text style={s.summary}>{summaryText}</Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={s.list}>
          {allPlates.map((weight) => {
            const isEnabled = enabledSet.has(weight);
            const chipColor = plateColors[weight] ?? '#666';
            // Use dark text on light chips
            const chipTextColor = [10, 25, 15, 35, 5].includes(weight) &&
              (chipColor === '#F5F5F5' || chipColor === '#FBBF24' || chipColor === '#22C55E')
              ? '#000'
              : '#fff';

            return (
              <View key={weight} style={s.row}>
                <View style={[s.chip, { backgroundColor: chipColor }]}>
                  <Text style={[s.chipText, { color: chipTextColor }]}>
                    {weight} {unitLabel}
                  </Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={() => onToggle(weight)}
                  trackColor={{ false: colors.surfaceElevated, true: colors.accent }}
                  thumbColor={colors.white}
                />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  header: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summary: {
    color: colors.textMuted,
    fontSize: 13,
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
