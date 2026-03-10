import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { HistorySetLog } from '../types';

interface SetRowProps {
  set: HistorySetLog;
  sessionExerciseId: string;
  onDeleteSet: (setId: string, sessionExerciseId: string) => void;
}

export function SetRow({ set, sessionExerciseId, onDeleteSet }: SetRowProps) {
  const handleLongPress = () => {
    Alert.alert(
      'Delete Set?',
      `Set ${set.set_number} will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDeleteSet(set.id, sessionExerciseId),
        },
      ]
    );
  };

  return (
    <Pressable onLongPress={handleLongPress} style={s.row}>
      <Text style={s.setLabel}>Set {set.set_number}</Text>
      <Text style={s.weight}>
        {set.weight} {set.unit}
      </Text>
      <Text style={s.reps}>x {set.reps}</Text>
      {set.is_pr && (
        <Ionicons
          name="trophy"
          size={14}
          color={colors.warning}
          style={s.prIcon}
        />
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.surfaceElevated,
  },
  setLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    width: 50,
  },
  weight: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    width: 80,
  },
  reps: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  prIcon: {
    marginLeft: 8,
  },
});
