import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { useWeeklyStats } from '@/features/weekly-stats/hooks/useWeeklyStats';
import type { WeeklyDay, WeeklySession, WeeklyExercise } from '@/features/weekly-stats/types';

function formatVolume(volume: number): string {
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k`;
  return volume.toLocaleString();
}

// ─── Summary Header ─────────────────────────────────────────────

function SummaryHeader({
  totalWorkouts,
  totalVolume,
  totalPRs,
  totalExercises,
  avgDurationMinutes,
  weeklyStreak,
  muscleGroupCounts,
}: {
  totalWorkouts: number;
  totalVolume: number;
  totalPRs: number;
  totalExercises: number;
  avgDurationMinutes: number | null;
  weeklyStreak: number;
  muscleGroupCounts: Record<string, number>;
}) {
  const topMuscles = Object.entries(muscleGroupCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <View style={s.summaryCard}>
      {/* Streak banner */}
      {weeklyStreak > 0 && (
        <View style={s.streakBanner}>
          <Ionicons name="flame-outline" size={18} color={colors.warning} />
          <Text style={s.streakText}>{weeklyStreak} week streak</Text>
        </View>
      )}

      {/* Stat grid */}
      <View style={s.statGrid}>
        <StatBox
          icon="barbell-outline"
          label="Workouts"
          value={String(totalWorkouts)}
        />
        <StatBox
          icon="stats-chart-outline"
          label="Volume"
          value={formatVolume(totalVolume)}
        />
        <StatBox
          icon="trophy-outline"
          label="PRs"
          value={String(totalPRs)}
        />
        <StatBox
          icon="time-outline"
          label="Avg Duration"
          value={avgDurationMinutes ? `${avgDurationMinutes}m` : '--'}
        />
      </View>

      {/* Exercises count */}
      <View style={s.exerciseCountRow}>
        <Ionicons name="list-outline" size={14} color={colors.textMuted} />
        <Text style={s.exerciseCountText}>
          {totalExercises} exercise{totalExercises !== 1 ? 's' : ''} performed
        </Text>
      </View>

      {/* Muscle group breakdown */}
      {topMuscles.length > 0 && (
        <View style={s.muscleSection}>
          <Text style={s.muscleSectionLabel}>Muscles Trained</Text>
          <View style={s.muscleChips}>
            {topMuscles.map(([name, count]) => (
              <View key={name} style={s.muscleChip}>
                <Text style={s.muscleChipText}>
                  {name} ({count})
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={s.statBox}>
      <Ionicons name={icon} size={16} color={colors.accent} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Day Breakdown Card ─────────────────────────────────────────

function DayCard({ day }: { day: WeeklyDay }) {
  const [expanded, setExpanded] = useState(false);
  const isRestDay = day.sessions.length === 0;

  return (
    <View style={[s.dayCard, day.isToday && s.dayCardToday]}>
      <Pressable
        style={s.dayHeader}
        onPress={() => !isRestDay && setExpanded((v) => !v)}
      >
        <View style={s.dayHeaderLeft}>
          <Text style={[s.dayName, day.isToday && s.dayNameToday]}>
            {day.dayFull}
          </Text>
          <Text style={s.dayDate}>{day.dateLabel}</Text>
        </View>

        {isRestDay ? (
          <View style={s.restBadge}>
            <Text style={s.restBadgeText}>Rest</Text>
          </View>
        ) : (
          <View style={s.dayHeaderRight}>
            <View style={s.dayStatChips}>
              <Text style={s.dayStatText}>
                {day.sessions.length} session{day.sessions.length !== 1 ? 's' : ''}
              </Text>
              {day.prCount > 0 && (
                <View style={s.prBadge}>
                  <Ionicons name="trophy-outline" size={10} color={colors.warning} />
                  <Text style={s.prBadgeText}>{day.prCount}</Text>
                </View>
              )}
            </View>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textMuted}
            />
          </View>
        )}
      </Pressable>

      {expanded && !isRestDay && (
        <View style={s.dayContent}>
          {day.sessions.map((session) => (
            <SessionDetail key={session.id} session={session} />
          ))}
        </View>
      )}
    </View>
  );
}

function SessionDetail({ session }: { session: WeeklySession }) {
  return (
    <View style={s.sessionBlock}>
      {/* Session meta */}
      <View style={s.sessionMeta}>
        {session.planName && (
          <Text style={s.sessionPlanName} numberOfLines={1}>
            {session.planName}
            {session.dayName ? ` - ${session.dayName}` : ''}
          </Text>
        )}
        <View style={s.sessionMetaRow}>
          {session.durationMinutes != null && (
            <View style={s.sessionMetaChip}>
              <Ionicons name="time-outline" size={12} color={colors.textMuted} />
              <Text style={s.sessionMetaText}>{session.durationMinutes}m</Text>
            </View>
          )}
          <View style={s.sessionMetaChip}>
            <Ionicons name="stats-chart-outline" size={12} color={colors.textMuted} />
            <Text style={s.sessionMetaText}>{formatVolume(session.totalVolume)}</Text>
          </View>
          {session.prCount > 0 && (
            <View style={s.sessionMetaChip}>
              <Ionicons name="trophy-outline" size={12} color={colors.warning} />
              <Text style={[s.sessionMetaText, { color: colors.warning }]}>
                {session.prCount} PR{session.prCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Exercises */}
      {session.exercises.map((ex, i) => (
        <ExerciseRow key={`${ex.name}-${i}`} exercise={ex} />
      ))}
    </View>
  );
}

function ExerciseRow({ exercise }: { exercise: WeeklyExercise }) {
  const [showSets, setShowSets] = useState(false);
  const hasPR = exercise.sets.some((s) => s.isPR);
  const bestSet = exercise.sets.reduce(
    (best, s) => (s.weight > best.weight ? s : best),
    exercise.sets[0],
  );

  return (
    <View style={s.exerciseRow}>
      <Pressable style={s.exerciseHeader} onPress={() => setShowSets((v) => !v)}>
        <View style={s.exerciseNameRow}>
          {hasPR && (
            <Ionicons name="trophy-outline" size={12} color={colors.warning} />
          )}
          <Text style={s.exerciseName} numberOfLines={1}>{exercise.name}</Text>
        </View>
        <View style={s.exerciseRight}>
          <Text style={s.exerciseSummary}>
            {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
            {bestSet ? ` | ${bestSet.weight} ${bestSet.unit} x ${bestSet.reps}` : ''}
          </Text>
          <Ionicons
            name={showSets ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.textMuted}
          />
        </View>
      </Pressable>

      {showSets && (
        <View style={s.setsContainer}>
          {exercise.sets.map((set, i) => (
            <View key={i} style={s.setRow}>
              <Text style={s.setNumber}>Set {set.setNumber}</Text>
              <Text style={[s.setText, set.isPR && s.setTextPR]}>
                {set.weight} {set.unit} x {set.reps}
              </Text>
              {set.isPR && (
                <Ionicons name="trophy" size={10} color={colors.warning} />
              )}
            </View>
          ))}
          <View style={s.setTotalRow}>
            <Text style={s.setTotalLabel}>Volume</Text>
            <Text style={s.setTotalValue}>{formatVolume(exercise.totalVolume)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Screen ─────────────────────────────────────────────────────

export default function WeeklyStatsScreen() {
  const router = useRouter();
  const { stats, isLoading, refresh } = useWeeklyStats();

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.navBar}>
        <Pressable onPress={() => router.back()} style={s.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <View style={s.navTitle}>
          <Text style={s.navTitleText}>Weekly Stats</Text>
        </View>
        <View style={s.navButton} />
      </View>

      {isLoading && !stats ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : !stats ? (
        <View style={s.emptyContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
          <Text style={s.emptyText}>No workout data available</Text>
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <SummaryHeader
            totalWorkouts={stats.totalWorkouts}
            totalVolume={stats.totalVolume}
            totalPRs={stats.totalPRs}
            totalExercises={stats.totalExercises}
            avgDurationMinutes={stats.avgDurationMinutes}
            weeklyStreak={stats.weeklyStreak}
            muscleGroupCounts={stats.muscleGroupCounts}
          />

          <Text style={s.sectionTitle}>Daily Breakdown</Text>

          {stats.days.map((day) => (
            <DayCard key={day.dayLabel} day={day} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  navButton: { padding: 8, width: 40 },
  navTitle: { flex: 1, alignItems: 'center' },
  navTitleText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Summary
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginBottom: 20,
  },
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  streakText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '500' },
  exerciseCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  exerciseCountText: { color: colors.textSecondary, fontSize: 13 },
  muscleSection: { marginTop: 4 },
  muscleSectionLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  muscleChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muscleChip: {
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
  },
  muscleChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '500' },

  // Section title
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Day card
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.surfaceElevated,
    marginBottom: 8,
    overflow: 'hidden',
  },
  dayCardToday: { borderColor: colors.accent },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  dayHeaderLeft: { gap: 2 },
  dayName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  dayNameToday: { color: colors.accent },
  dayDate: { color: colors.textMuted, fontSize: 12 },
  dayHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayStatChips: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayStatText: { color: colors.textSecondary, fontSize: 13 },
  restBadge: {
    backgroundColor: colors.background,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  restBadgeText: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  prBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  prBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '600' },
  dayContent: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },

  // Session
  sessionBlock: { paddingTop: 10 },
  sessionMeta: { marginBottom: 6 },
  sessionPlanName: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionMetaRow: { flexDirection: 'row', gap: 12 },
  sessionMetaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionMetaText: { color: colors.textMuted, fontSize: 12 },

  // Exercise
  exerciseRow: {
    marginTop: 6,
    backgroundColor: colors.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  exerciseNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  exerciseName: { color: colors.textPrimary, fontSize: 13, fontWeight: '500', flex: 1 },
  exerciseRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  exerciseSummary: { color: colors.textMuted, fontSize: 12 },

  // Sets
  setsContainer: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  setNumber: { color: colors.textMuted, fontSize: 12, width: 40 },
  setText: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  setTextPR: { color: colors.warning, fontWeight: '600' },
  setTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  setTotalLabel: { color: colors.textMuted, fontSize: 12 },
  setTotalValue: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
});
