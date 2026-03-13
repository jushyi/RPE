import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { BAR_PRESETS } from '@/features/calculator/constants/plates';
import type { BarPreset } from '@/features/calculator/types';

interface BarWeightPickerProps {
  selected: BarPreset;
  onSelect: (preset: BarPreset) => void;
  unit: 'kg' | 'lbs';
}

export function BarWeightPicker({ selected, onSelect, unit }: BarWeightPickerProps) {
  const [expanded, setExpanded] = useState(false);

  const displayWeight = (preset: BarPreset) =>
    unit === 'kg' ? `${preset.weightKg} kg` : `${preset.weightLb} lb`;

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  const handleSelect = (preset: BarPreset) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onSelect(preset);
    setExpanded(false);
  };

  return (
    <View style={s.container}>
      <Pressable style={s.header} onPress={toggle}>
        <Text style={s.label}>Bar Weight</Text>
        <View style={s.valueRow}>
          <Text style={s.value}>
            {selected.label} -- {displayWeight(selected)}
          </Text>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </Pressable>

      {expanded && (
        <View style={s.list}>
          {BAR_PRESETS.map((preset) => {
            const isSelected = preset.label === selected.label;
            return (
              <Pressable
                key={preset.label}
                style={[s.item, isSelected && s.itemSelected]}
                onPress={() => handleSelect(preset)}
              >
                <Text style={[s.itemText, isSelected && s.itemTextSelected]}>
                  {preset.label}
                </Text>
                <Text style={[s.itemWeight, isSelected && s.itemTextSelected]}>
                  {displayWeight(preset)}
                </Text>
              </Pressable>
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
  value: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  itemSelected: {
    backgroundColor: colors.surfaceElevated,
  },
  itemText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  itemTextSelected: {
    color: colors.accent,
    fontWeight: '700',
  },
  itemWeight: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});
