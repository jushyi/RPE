import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { calculateNextSet } from '@/features/calculator/utils/nextSetCalc';
import { NextSetCard } from './NextSetCard';

export function NextSetCalculator() {
  const preferredUnit = useAuthStore((s) => s.preferredUnit);
  const unitLabel = preferredUnit === 'kg' ? 'kg' : 'lbs';

  const [lastWeightText, setLastWeightText] = useState('');
  const [lastRepsText, setLastRepsText] = useState('');
  const [lastRpeText, setLastRpeText] = useState('');
  const [targetRpeText, setTargetRpeText] = useState('');
  const [targetRepsText, setTargetRepsText] = useState('');

  const lastWeight = parseFloat(lastWeightText) || 0;
  const lastReps = parseInt(lastRepsText, 10) || 0;
  const lastRpe = parseFloat(lastRpeText) || 0;
  const targetRpe = parseFloat(targetRpeText) || 0;
  const targetReps = parseInt(targetRepsText, 10) || 0;

  const allFilled =
    lastWeight > 0 && lastReps > 0 && lastRpe > 0 && targetRpe > 0 && targetReps > 0;

  const result = useMemo(() => {
    if (!allFilled) return null;
    return calculateNextSet({
      lastWeight,
      lastReps,
      lastRpe,
      targetRpe,
      targetReps,
      unit: preferredUnit,
    });
  }, [allFilled, lastWeight, lastReps, lastRpe, targetRpe, targetReps, preferredUnit]);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Last Set Section */}
      <Text style={s.sectionTitle}>Last Set</Text>

      <View style={s.row}>
        <View style={s.field}>
          <Text style={s.label}>Weight ({unitLabel})</Text>
          <TextInput
            style={s.input}
            value={lastWeightText}
            onChangeText={setLastWeightText}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Reps</Text>
          <TextInput
            style={s.input}
            value={lastRepsText}
            onChangeText={setLastRepsText}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>RPE</Text>
          <TextInput
            style={s.input}
            value={lastRpeText}
            onChangeText={setLastRpeText}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Target Section */}
      <Text style={[s.sectionTitle, s.topGap]}>Target</Text>

      <View style={s.row}>
        <View style={s.field}>
          <Text style={s.label}>RPE</Text>
          <TextInput
            style={s.input}
            value={targetRpeText}
            onChangeText={setTargetRpeText}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Reps</Text>
          <TextInput
            style={s.input}
            value={targetRepsText}
            onChangeText={setTargetRepsText}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </View>
      </View>

      {/* Result */}
      {result && (
        <View style={s.resultWrapper}>
          <NextSetCard result={result} unit={unitLabel} />
        </View>
      )}
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
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  topGap: {
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  field: {
    flex: 1,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlign: 'center',
  },
  resultWrapper: {
    marginTop: 20,
  },
});
