import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTodaysWorkout } from '@/features/dashboard/hooks/useTodaysWorkout';
import { useWorkoutSession } from '@/features/workout/hooks/useWorkoutSession';
import { usePlanStore } from '@/stores/planStore';
import { colors } from '@/constants/theme';
import type { WorkoutSession } from '@/features/workout/types';

interface TodaysWorkoutCardProps {
  completedSessions?: WorkoutSession[];
}

export function TodaysWorkoutCard({ completedSessions = [] }: TodaysWorkoutCardProps) {
  const workout = useTodaysWorkout();
  const router = useRouter();
  const { startFreestyle, startFromPlan } = useWorkoutSession();
  const activePlan = usePlanStore((s) => s.plans.find((p) => p.is_active));

  if (workout.state === 'planned' && workout.todayDay && workout.plan) {
    // Hide card if the planned workout day has already been completed
    if (completedSessions.some(s => s.plan_day_id === workout.todayDay!.id)) {
      return null;
    }

    return (
      <View style={s.wrap}>
        <Card title="Today's Workout">
          <Pressable
            onPress={() =>
              router.push({
                pathname: '/(app)/plans/[id]' as any,
                params: { id: workout.plan!.id },
              })
            }
            style={({ pressed }) => [pressed && { opacity: 0.85 }]}
          >
            <Text style={s.planName}>{workout.plan.name}</Text>
            <Text style={s.dayLabel}>{workout.todayDay.label}</Text>

            <View style={s.statsRow}>
              <View style={s.stat}>
                <Ionicons name="barbell-outline" size={16} color={colors.textMuted} />
                <Text style={s.statText}>
                  {workout.todayDay.exerciseCount} exercise{workout.todayDay.exerciseCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={s.stat}>
                <Ionicons name="time-outline" size={16} color={colors.textMuted} />
                <Text style={s.statText}>{workout.todayDay.estimatedDuration} min</Text>
              </View>
            </View>
          </Pressable>

          <View style={s.btnWrap}>
            <Button
              title="Start Workout"
              variant="primary"
              onPress={() => {
                const planDay = activePlan?.plan_days.find(
                  (d) => d.id === workout.todayDay!.id
                );
                if (planDay) startFromPlan(planDay);
              }}
            />
          </View>
        </Card>
      </View>
    );
  }

  if (workout.state === 'rest-day') {
    return (
      <View style={s.wrap}>
      <Card title="Today's Workout">
        <Text style={s.restTitle}>Rest Day</Text>
        {workout.nextDay && (
          <Text style={s.restTeaser}>
            Next: {workout.nextDay.label} -- {workout.nextDay.dayName}
          </Text>
        )}
        <View style={s.btnWrap}>
          <Button
            title="Quick Workout"
            variant="secondary"
            onPress={startFreestyle}
          />
        </View>
      </Card>
      </View>
    );
  }

  // no-plan state
  return (
    <View style={s.wrap}>
    <Card title="Today's Workout">
      <Text style={s.noPlanText}>No plan set up yet</Text>
      <View style={s.noPlanBtns}>
        <View style={s.noPlanBtn}>
          <Button
            title="Create a Plan"
            variant="secondary"
            onPress={() => router.push('/(app)/plans/create' as any)}
          />
        </View>
        <View style={s.noPlanBtn}>
          <Button
            title="Quick Workout"
            variant="secondary"
            onPress={startFreestyle}
          />
        </View>
      </View>
    </Card>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginTop: 16,
    marginBottom: 16,
  },
  planName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  dayLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 14,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  btnWrap: {
    marginTop: 4,
  },
  restTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  restTeaser: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 12,
  },
  noPlanText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginBottom: 14,
  },
  noPlanBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  noPlanBtn: {
    flex: 1,
  },
});
