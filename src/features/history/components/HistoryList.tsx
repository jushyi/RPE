import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/theme';
import { useHistory } from '../hooks/useHistory';
import { SessionCard } from './SessionCard';
import { PlanFilter } from './PlanFilter';
import { HistoryEmptyState } from './HistoryEmptyState';
import type { SessionListItem } from '../types';

export function HistoryList() {
  const router = useRouter();
  const { sessions, isLoading, fetchSessions, toListItem } = useHistory();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions(true);
  }, []);

  const listItems = useMemo(
    () => sessions.map(toListItem),
    [sessions, toListItem]
  );

  // Derive unique plan names for filter chips
  const uniquePlans = useMemo(() => {
    const planMap = new Map<string, string>();
    for (const session of sessions) {
      if (session.plan_id && session.plan_name) {
        planMap.set(session.plan_id, session.plan_name);
      }
    }
    return Array.from(planMap.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  // Apply filter
  const filteredItems = useMemo(() => {
    if (selectedPlanId === null) return listItems;
    if (selectedPlanId === 'freestyle') {
      return listItems.filter((item) => item.planName === null);
    }
    const planName = uniquePlans.find((p) => p.id === selectedPlanId)?.name;
    return listItems.filter((item) => item.planName === planName);
  }, [listItems, selectedPlanId, uniquePlans]);

  const handleSessionPress = useCallback(
    (sessionId: string) => {
      router.push(`/history/${sessionId}` as any);
    },
    [router]
  );

  const handleFetchMore = useCallback(() => {
    if (!isLoading && sessions.length > 0) {
      fetchSessions(true, sessions.length);
    }
  }, [isLoading, sessions.length, fetchSessions]);

  const handleStartWorkout = useCallback(() => {
    // Navigate to workout start - uses the active plan route from Phase 4
    router.push('/workout' as any);
  }, [router]);

  if (isLoading && sessions.length === 0) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!isLoading && sessions.length === 0) {
    return <HistoryEmptyState onStartWorkout={handleStartWorkout} />;
  }

  const renderItem = ({ item }: { item: SessionListItem }) => (
    <View style={s.cardWrapper}>
      <SessionCard
        session={item}
        onPress={() => handleSessionPress(item.id)}
      />
    </View>
  );

  return (
    <View style={s.container}>
      {uniquePlans.length > 0 && (
        <PlanFilter
          plans={uniquePlans}
          selectedPlanId={selectedPlanId}
          onSelect={setSelectedPlanId}
        />
      )}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        onEndReached={handleFetchMore}
        onEndReachedThreshold={0.3}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 12,
  },
});
