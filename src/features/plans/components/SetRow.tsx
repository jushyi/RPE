import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { TargetSet } from '../types';

interface SetRowProps {
  index: number;
  set: TargetSet;
  onChange: (updated: TargetSet) => void;
  onRemove: () => void;
}

export const SetRow = React.memo(function SetRow({ index, set, onChange, onRemove }: SetRowProps) {
  const handleChange = (field: keyof TargetSet, value: string) => {
    const num = value === '' ? 0 : parseFloat(value);
    if (field === 'rpe') {
      onChange({ ...set, rpe: value === '' ? null : (isNaN(num) ? set.rpe : num) });
    } else {
      onChange({ ...set, [field]: isNaN(num) ? set[field] : num });
    }
  };

  return (
    <View style={s.row}>
      <Text style={s.label}>Set {index + 1}</Text>
      <View style={s.fields}>
        <View style={s.field}>
          <Text style={s.fieldLabel}>Weight</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={set.weight === 0 ? '' : String(set.weight)}
            onChangeText={(v) => handleChange('weight', v)}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={s.field}>
          <Text style={s.fieldLabel}>Reps</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={set.reps === 0 ? '' : String(set.reps)}
            onChangeText={(v) => handleChange('reps', v)}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <View style={s.field}>
          <Text style={s.fieldLabel}>RPE</Text>
          <TextInput
            style={s.input}
            keyboardType="numeric"
            value={set.rpe === null ? '' : String(set.rpe)}
            onChangeText={(v) => handleChange('rpe', v)}
            placeholder="--"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
      <Pressable onPress={onRemove} hitSlop={8} style={s.removeBtn}>
        <Ionicons name="close-circle-outline" size={20} color={colors.error} />
      </Pressable>
    </View>
  );
});

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    width: 40,
  },
  fields: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  field: {
    flex: 1,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: colors.textPrimary,
    fontSize: 14,
    textAlign: 'center',
  },
  removeBtn: {
    padding: 4,
  },
});
