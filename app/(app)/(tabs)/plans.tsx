import { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/constants/theme';
import { usePlans } from '@/features/plans/hooks/usePlans';
import { PlanEmptyState } from '@/features/plans/components/PlanEmptyState';
import { PlanCard } from '@/features/plans/components/PlanCard';
import type { PlanSummary } from '@/features/plans/types';

export default function PlansScreen() {
  const router = useRouter();
  const { planSummaries, isLoading, fetchPlans, setActivePlan, deletePlan } = usePlans();

  useEffect(() => {
    fetchPlans();
  }, []);

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
      // Haptics not available (Expo Go) — skip silently
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
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>
        <Text style={s.header}>My Plans</Text>

        {showEmpty ? (
          <PlanEmptyState onCreatePress={handleCreatePress} />
        ) : (
          <FlatList
            data={planSummaries}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            showsVerticalScrollIndicator={false}
          />
        )}

        {!showEmpty && (
          <Pressable style={s.fab} onPress={handleCreatePress}>
            <Ionicons name="add" size={28} color="#ffffff" />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '800',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  list: {
    paddingHorizontal: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
