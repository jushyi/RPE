import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  LayoutAnimation,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import {
  useTraineeHistory,
  type TraineeSession,
} from '@/features/coaching/hooks/useTraineeHistory';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

function formatDuration(startedAt: string, endedAt: string | null): string | null {
  if (!endedAt) return null;
  const ms = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}min`;
}

function calculateVolume(session: TraineeSession): number {
  let total = 0;
  for (const ex of session.session_exercises ?? []) {
    for (const set of ex.set_logs ?? []) {
      total += set.weight * set.reps;
    }
  }
  return total;
}

export default function TraineeHistoryScreen() {
  const router = useRouter();
  const { traineeId, traineeName } = useLocalSearchParams<{
    traineeId: string;
    traineeName: string;
  }>();
  const { sessions, isLoading, hasMore, fetchSessions, fetchMore } =
    useTraineeHistory(traineeId ?? '');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (traineeId) fetchSessions(true);
  }, [traineeId]);

  const toggleExpand = useCallback((id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderSession = ({ item }: { item: TraineeSession }) => {
    const exerciseCount = item.session_exercises?.length ?? 0;
    const volume = calculateVolume(item);
    const duration = formatDuration(item.started_at, item.ended_at);
    const isExpanded = expandedId === item.id;

    return (
      <Pressable style={s.card} onPress={() => toggleExpand(item.id)}>
        {/* Session header */}
        <View style={s.cardHeader}>
          <View style={s.cardInfo}>
            <Text style={s.dateText}>{formatDate(item.started_at)}</Text>
            <Text style={s.titleText} numberOfLines={1}>
              {item.title || item.plan_name || 'Freestyle'}
            </Text>
          </View>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textMuted}
          />
        </View>

        {/* Summary row */}
        <View style={s.summaryRow}>
          <Text style={s.summaryText}>
            {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
          </Text>
          {volume > 0 && (
            <Text style={s.summaryText}>
              {volume.toLocaleString()} vol
            </Text>
          )}
          {duration && <Text style={s.summaryText}>{duration}</Text>}
        </View>

        {/* Expanded detail */}
        {isExpanded && (
          <View style={s.detail}>
            {(item.session_exercises ?? []).map((ex) => (
              <View key={ex.id} style={s.exerciseBlock}>
                <Text style={s.exerciseName}>{ex.exercise_name}</Text>
                {(ex.set_logs ?? []).map((set, i) => (
                  <Text key={i} style={s.setText}>
                    Set {i + 1}: {set.weight}{set.unit} x {set.reps}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>
          {traineeName ?? 'Trainee'}'s History
        </Text>
        <View style={s.headerSpacer} />
      </View>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasMore && !isLoading) fetchMore();
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Ionicons name="barbell-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyText}>No workout history yet</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          isLoading ? (
            <View style={s.loadingFooter}>
              <Text style={s.loadingText}>Loading...</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 24,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  dateText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  titleText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  summaryText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  detail: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceElevated,
  },
  exerciseBlock: {
    marginBottom: 10,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  setText: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingLeft: 12,
    lineHeight: 20,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
