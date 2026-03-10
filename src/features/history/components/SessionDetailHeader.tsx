import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import type { HistorySession } from '../types';
import { calculateTotalVolume, calculateDurationMinutes } from '../utils/volumeCalc';

interface SessionDetailHeaderProps {
  session: HistorySession;
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function SessionDetailHeader({ session }: SessionDetailHeaderProps) {
  const totalVolume = calculateTotalVolume(session.session_exercises);
  const durationMinutes = calculateDurationMinutes(session.started_at, session.ended_at);
  const exerciseCount = session.session_exercises.length;
  const prCount = session.session_exercises
    .flatMap((se) => se.set_logs)
    .filter((sl) => sl.is_pr).length;

  return (
    <View style={s.container}>
      <View style={s.statsRow}>
        {durationMinutes !== null && (
          <StatPill
            icon="time-outline"
            value={`${durationMinutes} min`}
          />
        )}
        <StatPill
          icon="barbell-outline"
          value={`${totalVolume.toLocaleString()} kg`}
        />
        <StatPill
          icon="fitness-outline"
          value={`${exerciseCount} exercises`}
        />
        {prCount > 0 && (
          <StatPill
            icon="trophy"
            value={`${prCount} PR${prCount > 1 ? 's' : ''}`}
            iconColor={colors.warning}
          />
        )}
      </View>
    </View>
  );
}

function StatPill({
  icon,
  value,
  iconColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  iconColor?: string;
}) {
  return (
    <View style={s.statPill}>
      <Ionicons name={icon} size={14} color={iconColor ?? colors.textMuted} />
      <Text style={s.statText}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  date: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  planLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  statText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
