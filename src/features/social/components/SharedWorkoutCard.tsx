import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { SharedItem, WorkoutSharePayload } from '@/features/social/types';

interface SharedWorkoutCardProps {
  item: SharedItem & { content_type: 'workout'; payload: WorkoutSharePayload };
  authorName: string;
  authorAvatar: string | null;
  onPress?: () => void;
  /** Relative timestamp string e.g. "2h ago" */
  timeLabel: string;
}

export function SharedWorkoutCard({
  item,
  authorName,
  authorAvatar,
  onPress,
  timeLabel,
}: SharedWorkoutCardProps) {
  const payload = item.payload as WorkoutSharePayload;

  // Truncate exercise names to 3 + "and N more"
  const MAX_EXERCISES = 3;
  let exerciseText: string;
  if (payload.exercise_names.length <= MAX_EXERCISES) {
    exerciseText = payload.exercise_names.join(', ');
  } else {
    const shown = payload.exercise_names.slice(0, MAX_EXERCISES).join(', ');
    const remaining = payload.exercise_names.length - MAX_EXERCISES;
    exerciseText = `${shown} and ${remaining} more`;
  }

  const initial = (authorName ?? 'U').charAt(0).toUpperCase();

  return (
    <Pressable style={s.card} onPress={onPress}>
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
        <Ionicons name="barbell-outline" size={18} color={colors.accent} />
      </View>

      {/* Body */}
      <View style={s.body}>
        <Text style={s.label}>Completed a workout</Text>
        <Text style={s.exercises} numberOfLines={2}>
          {exerciseText}
        </Text>

        {/* Stats row */}
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="layers-outline" size={14} color={colors.textMuted} />
            <Text style={s.statText}>{payload.total_sets} sets</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="fitness-outline" size={14} color={colors.textMuted} />
            <Text style={s.statText}>{payload.total_volume.toFixed(0)} vol</Text>
          </View>
          <View style={s.stat}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={s.statText}>{payload.duration_minutes}m</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
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
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  exercises: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
