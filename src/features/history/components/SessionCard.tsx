import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import type { SessionListItem } from '../types';

interface SessionCardProps {
  session: SessionListItem;
  onPress: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}`;
}

function formatVolume(volume: number): string {
  if (volume >= 1000) {
    return volume.toLocaleString() + ' kg';
  }
  return volume + ' kg';
}

function formatExercises(names: string[]): string {
  if (names.length <= 2) return names.join(', ');
  return `${names[0]}, ${names[1]} +${names.length - 2} more`;
}

export function SessionCard({ session, onPress }: SessionCardProps) {
  return (
    <Pressable onPress={onPress}>
      <Card>
        <View style={s.topRow}>
          <Text style={s.date}>{formatDate(session.date)}</Text>
          <View style={s.badgeRow}>
            {session.hasVideo && (
              <Ionicons name="videocam" size={14} color={colors.accent} />
            )}
            {session.prCount > 0 && (
              <View style={s.prBadge}>
                <Ionicons name="trophy" size={14} color={colors.warning} />
                <Text style={s.prText}>{session.prCount}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={s.exercises} numberOfLines={1}>
          {formatExercises(session.exerciseNames)}
        </Text>

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Ionicons name="barbell-outline" size={14} color={colors.textMuted} />
            <Text style={s.statText}>{formatVolume(session.totalVolume)}</Text>
          </View>

          {session.durationMinutes !== null && (
            <View style={s.stat}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <Text style={s.statText}>{session.durationMinutes} min</Text>
            </View>
          )}

          <View style={s.planLabel}>
            <Text style={session.planName ? s.planText : s.freestyleText}>
              {session.planName ?? 'Freestyle'}
            </Text>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const s = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  date: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning + '1A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  prText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  exercises: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  planLabel: {
    marginLeft: 'auto',
  },
  planText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  freestyleText: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
