import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

interface PlanFilterProps {
  plans: Array<{ id: string; name: string }>;
  selectedPlanId: string | null; // null = "All", "freestyle" = freestyle only
  onSelect: (planId: string | null) => void;
}

export function PlanFilter({ plans, selectedPlanId, onSelect }: PlanFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={s.scroll}
      contentContainerStyle={s.row}
    >
      <Chip
        label="All"
        active={selectedPlanId === null}
        onPress={() => onSelect(null)}
      />
      {plans.map((plan) => (
        <Chip
          key={plan.id}
          label={plan.name}
          active={selectedPlanId === plan.id}
          onPress={() => onSelect(plan.id)}
        />
      ))}
      <Chip
        label="Freestyle"
        active={selectedPlanId === 'freestyle'}
        onPress={() => onSelect('freestyle')}
      />
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, active ? s.chipActive : s.chipInactive]}
    >
      <Text style={[s.chipText, active ? s.chipTextActive : s.chipTextInactive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  scroll: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  row: {
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipActive: {
    backgroundColor: colors.accent + '33', // 20% opacity
  },
  chipInactive: {
    backgroundColor: colors.surface,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '700',
  },
  chipTextInactive: {
    color: colors.textSecondary,
  },
});
