import { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { useProgressSummary } from '@/features/dashboard/hooks/useProgressSummary';
import { Sparkline } from '@/features/progress/components/Sparkline';
import { colors } from '@/constants/theme';

/** Format volume with K suffix for large numbers */
function formatVolume(volume: number): string {
  if (volume >= 10000) return `${(volume / 1000).toFixed(1)}k`;
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return volume.toLocaleString();
}

export function ProgressSummaryCard() {
  const { summary, sparklines, isLoading, refresh } = useProgressSummary();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const hasSparklines = Object.keys(sparklines).length > 0;

  return (
    <Card title="Progress">
      {/* Streak */}
      <View style={s.streakRow}>
        <Ionicons
          name="flame-outline"
          size={20}
          color={summary.weeklyStreak > 0 ? colors.warning : colors.textMuted}
        />
        <Text style={s.streakText}>
          {summary.weeklyStreak > 0
            ? `${summary.weeklyStreak} week streak`
            : 'Start your streak!'}
        </Text>
      </View>

      {/* Recent PRs */}
      <View style={s.prSection}>
        {summary.recentPRs.length > 0 ? (
          summary.recentPRs.slice(0, 3).map((pr, i) => (
            <View key={`${pr.exerciseName}-${i}`} style={s.prRow}>
              <Ionicons name="trophy-outline" size={14} color={colors.warning} />
              <Text style={s.prText} numberOfLines={1}>
                {pr.exerciseName}
              </Text>
              <Text style={s.prWeight}>
                {pr.weight} {pr.unit}
              </Text>
            </View>
          ))
        ) : (
          <Text style={s.noPrText}>No PRs yet -- keep lifting!</Text>
        )}
      </View>

      {/* Weekly Stats */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <View style={s.statHeader}>
            <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
            <Text style={s.statLabel}>Workouts</Text>
          </View>
          <Text style={s.statValue}>{summary.weekWorkoutCount}</Text>
          <Text style={s.statSub}>this week</Text>
        </View>
        <View style={s.statBox}>
          <View style={s.statHeader}>
            <Ionicons name="stats-chart-outline" size={14} color={colors.textMuted} />
            <Text style={s.statLabel}>Volume</Text>
          </View>
          <Text style={s.statValue}>{formatVolume(summary.weekTotalVolume)}</Text>
          <Text style={s.statSub}>this week</Text>
        </View>
      </View>

      {/* Sparkline Trends */}
      {hasSparklines && (
        <View style={s.sparkSection}>
          {Object.entries(sparklines).map(([name, data]) => (
            <View key={name} style={s.sparkItem}>
              <Text style={s.sparkLabel}>{name}</Text>
              <Sparkline data={data} color={colors.accent} width={60} height={24} />
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  streakText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  prSection: {
    marginBottom: 14,
  },
  prRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  prText: {
    color: colors.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  prWeight: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  noPrText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  statSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  sparkSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  sparkItem: {
    alignItems: 'center',
    gap: 4,
  },
  sparkLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
});
