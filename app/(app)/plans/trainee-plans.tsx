import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { useCoachPlans } from '@/features/coaching/hooks/useCoachPlans';
import { CoachPlanBadge } from '@/features/coaching/components/CoachPlanBadge';
import type { Plan } from '@/features/plans/types';

export default function TraineePlansScreen() {
  const router = useRouter();
  const { traineeId, traineeName } = useLocalSearchParams<{
    traineeId: string;
    traineeName: string;
  }>();
  const userId = useAuthStore((s) => s.userId);
  const { plans, isLoading, fetchTraineePlans, deleteTraineePlan } =
    useCoachPlans(traineeId ?? '');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (traineeId) fetchTraineePlans();
    }, [traineeId, fetchTraineePlans])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchTraineePlans();
    } finally {
      setRefreshing(false);
    }
  }, [fetchTraineePlans]);

  const handleCreatePress = () => {
    router.push({
      pathname: '/plans/coach-create' as any,
      params: { traineeId, traineeName },
    });
  };

  const handleHistoryPress = () => {
    router.push({
      pathname: '/plans/trainee-history' as any,
      params: { traineeId, traineeName },
    });
  };

  const handlePlanPress = (plan: Plan) => {
    router.push(`/plans/${plan.id}` as any);
  };

  const handleDeletePlan = (plan: Plan) => {
    Alert.alert(
      `Delete "${plan.name}"?`,
      'This plan will be removed from the trainee.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTraineePlan(plan.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete plan.');
            }
          },
        },
      ]
    );
  };

  const isCoachOwned = (plan: Plan) => plan.coach_id === userId;

  const renderItem = ({ item }: { item: Plan }) => {
    const coachOwned = isCoachOwned(item);
    const dayCount = item.plan_days?.length ?? 0;
    const dayNames = (item.plan_days ?? []).map((d) => d.day_name).join(', ');

    return (
      <Pressable
        style={s.card}
        onPress={() => handlePlanPress(item)}
      >
        <View style={s.cardHeader}>
          <Text style={s.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {item.is_active && (
            <View style={s.activeBadge}>
              <Text style={s.activeText}>Active</Text>
            </View>
          )}
        </View>

        <View style={s.cardDetails}>
          <Ionicons name="calendar-outline" size={14} color={colors.textMuted} />
          <Text style={s.detailText}>
            {dayCount} {dayCount === 1 ? 'day' : 'days'}
            {dayNames ? ` \u00B7 ${dayNames}` : ''}
          </Text>
        </View>

        <View style={s.cardFooter}>
          {coachOwned ? (
            <View style={s.coachBadgeRow}>
              <CoachPlanBadge />
              <Pressable
                style={s.deleteBtn}
                onPress={() => handleDeletePlan(item)}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error} />
              </Pressable>
            </View>
          ) : (
            <Text style={s.readOnlyLabel}>Personal plan (read-only)</Text>
          )}
        </View>
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
          {traineeName ?? 'Trainee'}'s Plans
        </Text>
        <View style={s.headerActions}>
          <Pressable onPress={handleHistoryPress} hitSlop={8} style={s.headerBtn}>
            <Ionicons name="time-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Pressable onPress={handleCreatePress} hitSlop={8} style={s.headerBtn}>
            <Ionicons name="add-circle-outline" size={22} color={colors.accent} />
          </Pressable>
        </View>
      </View>

      {/* Plan List */}
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <Ionicons name="clipboard-outline" size={48} color={colors.textMuted} />
              <Text style={s.emptyText}>No plans yet</Text>
              <Pressable style={s.createBtn} onPress={handleCreatePress}>
                <Text style={s.createBtnText}>Create Plan</Text>
              </Pressable>
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    padding: 4,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  activeBadge: {
    backgroundColor: colors.accent + '22',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  detailText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  cardFooter: {
    marginTop: 4,
  },
  coachBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteBtn: {
    padding: 4,
  },
  readOnlyLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
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
  createBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  createBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
