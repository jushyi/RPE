import React, { useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { BodyMeasurement } from '../types';

interface MeasurementHistoryItemProps {
  entry: BodyMeasurement;
  onEdit: () => void;
  onDelete: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function MeasurementHistoryItem({
  entry,
  onEdit,
  onDelete,
}: MeasurementHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Delete Entry?',
      'This measurement entry will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            try {
              const Haptics = require('expo-haptics');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            } catch {
              // Haptics not available
            }
            onDelete();
          },
        },
      ],
    );
  };

  const values: { label: string; display: string }[] = [];
  if (entry.chest != null) {
    values.push({ label: 'Chest', display: `${entry.chest} ${entry.chest_unit ?? ''}` });
  }
  if (entry.waist != null) {
    values.push({ label: 'Waist', display: `${entry.waist} ${entry.waist_unit ?? ''}` });
  }
  if (entry.hips != null) {
    values.push({ label: 'Hips', display: `${entry.hips} ${entry.hips_unit ?? ''}` });
  }
  if (entry.body_fat_pct != null) {
    values.push({ label: 'Body Fat', display: `${entry.body_fat_pct}%` });
  }

  return (
    <Pressable
      style={s.card}
      onPress={() => setExpanded(!expanded)}
    >
      {/* Top row: date + chevron */}
      <View style={s.topRow}>
        <Text style={s.date}>{formatDate(entry.measured_at)}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textMuted}
        />
      </View>

      {/* Measurement values - compact row */}
      <View style={s.valuesRow}>
        {values.map((v) => (
          <View key={v.label} style={s.valueChip}>
            <Text style={s.valueLabel}>{v.label}</Text>
            <Text style={s.valueText}>{v.display}</Text>
          </View>
        ))}
        {values.length === 0 && (
          <Text style={s.noValues}>No measurements</Text>
        )}
      </View>

      {/* Expanded actions */}
      {expanded && (
        <View style={s.actionsRow}>
          <Pressable style={s.editBtn} onPress={onEdit}>
            <Ionicons name="pencil-outline" size={16} color={colors.accent} />
            <Text style={s.editBtnText}>Edit</Text>
          </Pressable>
          <Pressable style={s.deleteBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={16} color={colors.error} />
            <Text style={s.deleteBtnText}>Delete</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  valuesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  valueChip: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  valueLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  valueText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  noValues: {
    color: colors.textMuted,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  editBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
});
