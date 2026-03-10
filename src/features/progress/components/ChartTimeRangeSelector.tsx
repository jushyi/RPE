import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { TimeRange } from '../types';

interface ChartTimeRangeSelectorProps {
  selected: TimeRange;
  onSelect: (range: TimeRange) => void;
}

const RANGES: TimeRange[] = ['1M', '3M', '6M', '1Y', 'all'];

const LABELS: Record<TimeRange, string> = {
  '1M': '1M',
  '3M': '3M',
  '6M': '6M',
  '1Y': '1Y',
  all: 'All',
};

export function ChartTimeRangeSelector({ selected, onSelect }: ChartTimeRangeSelectorProps) {
  return (
    <View style={s.row}>
      {RANGES.map((range) => {
        const isSelected = range === selected;
        return (
          <Pressable
            key={range}
            onPress={() => onSelect(range)}
            style={[s.chip, isSelected && s.chipSelected]}
          >
            <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
              {LABELS[range]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: `${colors.accent}33`,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: colors.accent,
  },
});
