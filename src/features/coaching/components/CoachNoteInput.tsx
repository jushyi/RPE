import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';

interface CoachNoteInputProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function CoachNoteInput({ value, onChangeText }: CoachNoteInputProps) {
  return (
    <View style={s.container}>
      <View style={s.labelRow}>
        <Ionicons name="chatbox-outline" size={18} color={colors.textSecondary} />
        <Text style={s.label}>Add note for trainee</Text>
      </View>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={(text) => onChangeText(text.slice(0, 200))}
        placeholder="e.g., Great week, bumping your bench target"
        placeholderTextColor={colors.textMuted}
        multiline
        maxLength={200}
        textAlignVertical="top"
      />
      <Text style={s.charCount}>{value.length}/200</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 12,
    minHeight: 60,
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
