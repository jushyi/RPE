import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { colors } from '@/constants/theme';
import { usePlans } from '@/features/plans/hooks/usePlans';
import { PlanEmptyState } from '@/features/plans/components/PlanEmptyState';
import { PlanCard } from '@/features/plans/components/PlanCard';
import { CoachPlanBadge } from '@/features/coaching/components/CoachPlanBadge';
import { CoachTraineeToggle, type CoachToggleValue } from '@/features/coaching/components/CoachTraineeToggle';
import { TraineeCard } from '@/features/coaching/components/TraineeCard';
import { InviteCodeModal } from '@/features/coaching/components/InviteCodeModal';
import { useCoaching } from '@/features/coaching/hooks/useCoaching';
import { HistoryList } from '@/features/history/components/HistoryList';
import { useExercises } from '@/features/exercises/hooks/useExercises';
import { ExerciseFilterBar } from '@/features/exercises/components/ExerciseFilterBar';
import { ExerciseListItem } from '@/features/exercises/components/ExerciseListItem';
import { EmptyState } from '@/features/exercises/components/EmptyState';
import { ExerciseBottomSheet } from '@/features/exercises/components/ExerciseBottomSheet';
import { isCustomExercise } from '@/features/exercises/types';
import type { PlanSummary } from '@/features/plans/types';
import type { MuscleGroup, Equipment, Exercise } from '@/features/exercises/types';

const TABS = ['Plans', 'History', 'Exercises'] as const;

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
        offscreenPageLimit={2}
      >
        <View key="plans" style={s.page}>
          <PlansContent />
        </View>
        <View key="history" style={s.page}>
          <HistoryList />
        </View>
        <View key="exercises" style={s.page}>
          <ExercisesContent />
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
  const {
    trainees,
    coaches,
    relationships,
    hasAnyRelationship,
    fetchRelationships,
    disconnect,
  } = useCoaching();
  const [refreshing, setRefreshing] = useState(false);
  const [coachToggle, setCoachToggle] = useState<CoachToggleValue>('my-plans');
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchRelationships();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchPlans(true), fetchRelationships()]);
    } finally {
      setRefreshing(false);
    }
  }, [fetchPlans, fetchRelationships]);

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

  const handleDisconnect = (relationshipId: string, traineeName: string) => {
    Alert.alert(
      `Disconnect from ${traineeName}?`,
      'This will end the coaching relationship. Existing plans will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnect(relationshipId);
            } catch (err) {
              Alert.alert('Error', 'Failed to disconnect.');
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
      {item.coach_id && (
        <View style={s.coachBadgeRow}>
          <CoachPlanBadge />
        </View>
      )}
    </View>
  );

  const showEmpty = !isLoading && planSummaries.length === 0;
  const showTrainees = coachToggle === 'trainees' && hasAnyRelationship;

  return (
    <View style={s.plansContainer}>
      {/* Coaching toggle -- only when user has relationships */}
      {hasAnyRelationship && (
        <CoachTraineeToggle value={coachToggle} onValueChange={setCoachToggle} />
      )}

      {showTrainees ? (
        <FlatList
          data={trainees}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const rel = relationships.find(
              (r) => r.trainee_id === item.id
            );
            return (
              <TraineeCard
                trainee={item}
                onPress={() => {
                  router.push({
                    pathname: '/plans/trainee-plans' as any,
                    params: {
                      traineeId: item.id,
                      traineeName: item.display_name,
                    },
                  });
                }}
                onDisconnect={() => {
                  if (rel) handleDisconnect(rel.id, item.display_name);
                }}
              />
            );
          }}
          contentContainerStyle={s.traineeList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={s.emptyTrainees}>
              <Text style={s.emptyTraineesText}>
                No trainees yet. Share an invite code to connect.
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
        />
      ) : showEmpty ? (
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

      {!showEmpty && !showTrainees && (
        <Pressable style={s.fab} onPress={handleCreatePress}>
          <Ionicons name="add" size={28} color={colors.white} />
        </Pressable>
      )}

      {/* Coaching FAB */}
      <Pressable
        style={s.coachingFab}
        onPress={() => setInviteModalVisible(true)}
      >
        <Ionicons name="people-outline" size={20} color={colors.white} />
        <Text style={s.coachingFabText}>Coaching</Text>
      </Pressable>

      <InviteCodeModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
      />
    </View>
  );
}

/** Exercise library content -- moved from exercises.tsx tab */
function ExercisesContent() {
  const { exercises, isLoading, fetchExercises, deleteExercise } = useExercises();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const filteredExercises = useMemo(() => {
    let result = exercises;

    if (selectedMuscleGroup) {
      result = result.filter((e) => (e.muscle_groups ?? []).includes(selectedMuscleGroup));
    }
    if (selectedEquipment) {
      result = result.filter((e) => e.equipment === selectedEquipment);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((e) => e.name.toLowerCase().includes(q));
    }

    return result;
  }, [exercises, selectedMuscleGroup, selectedEquipment, searchQuery]);

  const hasFilters = !!(selectedMuscleGroup || selectedEquipment || searchQuery.trim());

  const handleAddExercise = useCallback(() => {
    setExerciseToEdit(null);
    setReadOnly(false);
    bottomSheetRef.current?.present();
  }, []);

  const handlePress = useCallback(
    (exercise: Exercise) => {
      setExerciseToEdit(exercise);
      setReadOnly(!isCustomExercise(exercise));
      bottomSheetRef.current?.present();
    },
    []
  );

  const handleSave = useCallback(() => {
    setExerciseToEdit(null);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseListItem
        exercise={item}
        onPress={() => handlePress(item)}
      />
    ),
    [handlePress]
  );

  return (
    <View style={s.exercisesContainer}>
      <View style={s.exercisesFilterWrapper}>
        <ExerciseFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedMuscleGroup={selectedMuscleGroup}
          onMuscleGroupChange={setSelectedMuscleGroup}
          selectedEquipment={selectedEquipment}
          onEquipmentChange={setSelectedEquipment}
        />
      </View>

      {filteredExercises.length === 0 && !isLoading ? (
        <EmptyState hasFilters={hasFilters} onAddExercise={handleAddExercise} />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={s.exercisesList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleAddExercise}
        style={({ pressed }) => [s.exercisesFab, pressed && s.exercisesFabPressed]}
      >
        <Text style={s.exercisesFabText}>+</Text>
      </Pressable>

      <ExerciseBottomSheet
        ref={bottomSheetRef}
        exerciseToEdit={exerciseToEdit}
        readOnly={readOnly}
        onSave={handleSave}
        onDelete={deleteExercise}
      />
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
  coachBadgeRow: {
    marginTop: 4,
    paddingLeft: 4,
  },
  traineeList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  emptyTrainees: {
    paddingTop: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTraineesText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
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
  coachingFab: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 28,
    elevation: 4,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  coachingFabText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  exercisesContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  exercisesFilterWrapper: {
    paddingTop: 12,
  },
  exercisesList: {
    paddingTop: 4,
    paddingBottom: 80,
  },
  exercisesFab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  exercisesFabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  exercisesFabText: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
});
