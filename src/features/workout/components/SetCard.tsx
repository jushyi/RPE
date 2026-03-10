import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';
import {
  MAX_WEIGHT,
  MAX_REPS,
} from '@/features/workout/constants';
import type { TargetSet } from '@/features/plans/types';

interface SetCardProps {
  targetSet?: TargetSet;
  setNumber: number;
  unit: 'kg' | 'lbs';
  onLog: (weight: number, reps: number, rpe: number | null) => void;
  isLogged?: boolean;
}

export function SetCard({ targetSet, setNumber, unit, onLog, isLogged }: SetCardProps) {
  const [weight, setWeight] = useState(
    targetSet?.weight && targetSet.weight > 0 ? String(targetSet.weight) : ''
  );
  const [reps, setReps] = useState(
    targetSet?.reps && targetSet.reps > 0 ? String(targetSet.reps) : ''
  );
  const [rpe, setRpe] = useState(
    targetSet?.rpe != null && targetSet.rpe > 0 ? String(targetSet.rpe) : ''
  );
  const hasLogged = useRef(isLogged ?? false);
  const userEdited = useRef(false);

  // Auto-log when user edits and both weight+reps have valid values
  useEffect(() => {
    if (hasLogged.current || !userEdited.current) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (w > 0 && r > 0) {
      hasLogged.current = true;
      const rpeVal = rpe ? parseFloat(rpe) : null;
      onLog(w, r, rpeVal);
    }
  }, [weight, reps, rpe, onLog]);

  const handleWeightChange = useCallback((text: string) => {
    userEdited.current = true;
    const cleaned = text.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (cleaned === '' || (val >= 0 && val <= MAX_WEIGHT)) {
      setWeight(cleaned);
    }
  }, []);

  const handleRepsChange = useCallback((text: string) => {
    userEdited.current = true;
    const cleaned = text.replace(/[^0-9]/g, '');
    const val = parseInt(cleaned, 10);
    if (cleaned === '' || (val >= 0 && val <= MAX_REPS)) {
      setReps(cleaned);
    }
  }, []);

  const handleRpeChange = useCallback((text: string) => {
    userEdited.current = true;
    const cleaned = text.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleaned);
    if (cleaned === '' || (val >= 0 && val <= 10)) {
      setRpe(cleaned);
    }
  }, []);

  return (
    <View style={[s.card, hasLogged.current && s.cardLogged]}>
      <View style={s.setHeader}>
        <Text style={s.setLabel}>Set {setNumber}</Text>
        {hasLogged.current && <Text style={s.loggedBadge}>Logged</Text>}
      </View>
      <View style={s.inputRow}>
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Weight ({unit})</Text>
          <TextInput
            style={s.input}
            value={weight}
            onChangeText={handleWeightChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>
        <View style={s.separator} />
        <View style={s.inputGroup}>
          <Text style={s.inputLabel}>Reps</Text>
          <TextInput
            style={s.input}
            value={reps}
            onChangeText={handleRepsChange}
            keyboardType="number-pad"
            returnKeyType="done"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>
        <View style={s.separator} />
        <View style={s.inputGroupSmall}>
          <Text style={s.inputLabel}>RPE</Text>
          <TextInput
            style={s.inputSmall}
            value={rpe}
            onChangeText={handleRpeChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
            placeholder="--"
            placeholderTextColor={colors.textMuted}
            selectTextOnFocus
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  cardLogged: {
    borderColor: colors.accent,
    borderWidth: 1,
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  setLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  loggedBadge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  inputGroupSmall: {
    width: 70,
    alignItems: 'center',
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 60,
    minWidth: 100,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputSmall: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    minHeight: 60,
    width: 60,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  separator: {
    width: 1,
    height: 40,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 8,
  },
});
