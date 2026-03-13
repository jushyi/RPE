import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { SharedItem, PRSharePayload } from '@/features/social/types';

interface SharedPRCardProps {
  item: SharedItem & { content_type: 'pr'; payload: PRSharePayload };
  authorName: string;
  authorAvatar: string | null;
  /** Relative timestamp string e.g. "2h ago" */
  timeLabel: string;
}

export function SharedPRCard({
  item,
  authorName,
  timeLabel,
}: SharedPRCardProps) {
  const payload = item.payload as PRSharePayload;
  const initial = (authorName ?? 'U').charAt(0).toUpperCase();

  return (
    <View style={s.card}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initial}</Text>
        </View>
        <View style={s.headerInfo}>
          <Text style={s.authorName} numberOfLines={1}>
            {authorName}
          </Text>
          <Text style={s.timestamp}>{timeLabel}</Text>
        </View>
        <Ionicons name="trophy-outline" size={18} color={colors.warning} />
      </View>

      {/* Body */}
      <View style={s.body}>
        <View style={s.prBadge}>
          <Ionicons name="trophy-outline" size={14} color={colors.warning} style={s.badgeIcon} />
          <Text style={s.newPRText}>New PR</Text>
        </View>
        <Text style={s.exerciseName}>{payload.exercise_name}</Text>
        <Text style={s.weightText}>
          {payload.weight} {payload.unit}
          <Text style={s.repsText}> x {payload.reps} reps</Text>
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning + '44',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + '33',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.accent,
  },
  headerInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  body: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: colors.warning + '0d',
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeIcon: {
    marginRight: 4,
  },
  newPRText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  weightText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.warning,
  },
  repsText: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textSecondary,
  },
});
