import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PagerView from 'react-native-pager-view';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/constants/theme';
import { usePlans } from '@/features/plans/hooks/usePlans';
import { PlanEmptyState } from '@/features/plans/components/PlanEmptyState';
import { PlanCard } from '@/features/plans/components/PlanCard';
import { HistoryList } from '@/features/history/components/HistoryList';
import type { PlanSummary } from '@/features/plans/types';

const TABS = ['Plans', 'History'] as const;

export default function PlansScreen() {
  const pagerRef = useRef<PagerView>(null);
  const [activeTab, setActiveTab] = useState(0);
  const indicatorX = useSharedValue(0);
  const [tabWidth, setTabWidth] = useState(0);

  const handleTabPress = useCallback(
    (index: number) => {
      pagerRef.current?.setPage(index);
    },
    []
  );

  const onPageSelected = useCallback(
    (e: any) => {
      const position = e.nativeEvent.position;
      setActiveTab(position);
      indicatorX.value = withTiming(position * tabWidth, { duration: 200 });
    },
    [tabWidth, indicatorX]
  );

  const onTabBarLayout = useCallback(
    (e: any) => {
      const width = e.nativeEvent.layout.width / TABS.length;
      setTabWidth(width);
      // Set initial position
      indicatorX.value = activeTab * width;
    },
    [activeTab, indicatorX]
  );

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: tabWidth || 0,
  }));

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Tab Bar */}
      <View style={s.tabBar} onLayout={onTabBarLayout}>
        {TABS.map((tab, index) => (
          <Pressable
            key={tab}
            style={s.tabItem}
            onPress={() => handleTabPress(index)}
          >
            <Text
              style={[
                s.tabText,
                activeTab === index ? s.tabTextActive : s.tabTextInactive,
              ]}
            >
              {tab}
            </Text>
          </Pressable>
        ))}
        <Animated.View style={[s.tabIndicator, indicatorStyle]} />
      </View>

      {/* Pager */}
      <PagerView
        ref={pagerRef}
        style={s.pager}
        initialPage={0}
        onPageSelected={onPageSelected}
        offscreenPageLimit={1}
      >
        <View key="plans" style={s.page}>
          <PlansContent />
        </View>
        <View key="history" style={s.page}>
          <HistoryList />
        </View>
      </PagerView>
    </SafeAreaView>
  );
}

/** Extracted plans list content -- preserves all existing functionality */
function PlansContent() {
  const router = useRouter();
  const { planSummaries, isLoading, fetchPlans, setActivePlan, deletePlan } =
    usePlans();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchPlans(true);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPlans]);

  const handleCreatePress = () => {
    router.push('/plans/create' as any);
  };

  const handlePlanPress = (id: string) => {
    router.push(`/plans/${id}` as any);
  };

  const handleSetActive = (id: string) => {
    try {
      const Haptics = require('expo-haptics');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Haptics not available (Expo Go) -- skip silently
    }
    setActivePlan(id);
  };

  const handleDeletePlan = (plan: PlanSummary) => {
    Alert.alert(
      `Delete "${plan.name}"?`,
      'Past workouts logged with this plan will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePlan(plan.id);
            } catch (err) {
              Alert.alert('Error', 'Failed to delete plan.');
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: PlanSummary }) => (
    <View style={s.cardWrapper}>
      <PlanCard
        plan={item}
        onPress={() => handlePlanPress(item.id)}
        onLongPress={() => handleSetActive(item.id)}
        onDelete={() => handleDeletePlan(item)}
      />
    </View>
  );

  const showEmpty = !isLoading && planSummaries.length === 0;

  return (
    <View style={s.plansContainer}>
      {showEmpty ? (
        <PlanEmptyState onCreatePress={handleCreatePress} />
      ) : (
        <FlatList
          data={planSummaries}
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
        />
      )}

      {!showEmpty && (
        <Pressable style={s.fab} onPress={handleCreatePress}>
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceElevated,
    position: 'relative',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.accent,
  },
  tabTextInactive: {
    color: colors.textSecondary,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    backgroundColor: colors.accent,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  plansContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
