import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { calculateEpley1RM } from '@/features/history/utils/epley';
import { Card } from '@/components/ui/Card';
import { RpeTable } from './RpeTable';

export function RpeCalculator() {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const [weightText, setWeightText] = useState('');
  const [repsText, setRepsText] = useState('');

  const weight = parseFloat(weightText) || 0;
  const reps = parseInt(repsText, 10) || 0;
  const unitLabel = preferredUnit === 'kg' ? 'kg' : 'lbs';

  const e1rm = useMemo(() => {
    if (weight <= 0 || reps <= 0) return 0;
    return calculateEpley1RM(weight, reps);
  }, [weight, reps]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Weight Input */}
      <Text style={s.label}>Weight ({unitLabel})</Text>
      <TextInput
        style={s.input}
        value={weightText}
        onChangeText={setWeightText}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
      />

      {/* Reps Input */}
      <Text style={[s.label, s.topGap]}>Reps</Text>
      <TextInput
        style={s.input}
        value={repsText}
        onChangeText={setRepsText}
        keyboardType="number-pad"
        placeholder="0"
        placeholderTextColor={colors.textMuted}
        returnKeyType="done"
      />

      {/* Estimated 1RM */}
      {e1rm > 0 && (
        <Card>
          <Text style={s.e1rmLabel}>Estimated 1RM</Text>
          <Text style={s.e1rmValue}>
            {Math.round(e1rm * 10) / 10} {unitLabel}
          </Text>
        </Card>
      )}

      {/* RPE Table */}
      <RpeTable e1rm={e1rm} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  topGap: {
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
  },
  e1rmLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  e1rmValue: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '800',
  },
});
