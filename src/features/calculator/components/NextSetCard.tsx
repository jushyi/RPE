import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import type { NextSetResult } from '@/features/calculator/types';

interface NextSetCardProps {
  result: NextSetResult;
  unit: string;
}

export function NextSetCard({ result, unit }: NextSetCardProps) {
  const isPositive = result.percentChange >= 0;
  const changeColor = isPositive ? colors.success : colors.error;
  const changeSign = isPositive ? '+' : '';

  return (
    <Card>
      <Text style={s.heading}>Recommended Weight</Text>
      <Text style={s.weight}>
        {result.recommendedWeight} {unit}
      </Text>

      <View style={[s.badge, { backgroundColor: changeColor + '20' }]}>
        <Text style={[s.badgeText, { color: changeColor }]}>
          {changeSign}{result.percentChange.toFixed(1)}%
        </Text>
      </View>

      <Text style={s.explanation}>{result.explanation}</Text>
    </Card>
  );
}

const s = StyleSheet.create({
  heading: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  weight: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 15,
    fontWeight: '700',
  },
  explanation: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
