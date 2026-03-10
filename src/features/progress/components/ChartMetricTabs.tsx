import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import type { ChartMetric } from '../types';

interface ChartMetricTabsProps {
  selected: ChartMetric;
  onSelect: (metric: ChartMetric) => void;
}

const TABS: { key: ChartMetric; label: string }[] = [
  { key: 'estimated_1rm', label: 'Est. 1RM' },
  { key: 'max_weight', label: 'Max Weight' },
  { key: 'total_volume', label: 'Volume' },
];

export function ChartMetricTabs({ selected, onSelect }: ChartMetricTabsProps) {
  return (
    <View style={s.row}>
      {TABS.map((tab) => {
        const isSelected = tab.key === selected;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onSelect(tab.key)}
            style={[s.tab, isSelected && s.tabSelected]}
          >
            <Text style={[s.tabText, isSelected && s.tabTextSelected]}>
              {tab.label}
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
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  tabSelected: {
    backgroundColor: `${colors.accent}33`, // 20% opacity
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextSelected: {
    color: colors.accent,
  },
});
