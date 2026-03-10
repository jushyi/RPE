import { useMemo } from 'react';
import { usePlanStore } from '@/stores/planStore';
import { estimateWorkoutDuration } from '@/features/progress/utils/chartHelpers';
import type { Plan } from '@/features/plans/types';
import type { TodaysWorkoutState } from '@/features/progress/types';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Pure function for determining today's workout state.
 * Extracted for testability.
 */
export function determineTodaysWorkout(
  activePlan: Plan | null | undefined,
  todayWeekday: number,
): TodaysWorkoutState {
  if (!activePlan) {
    return { state: 'no-plan' };
  }

  const todayDay = activePlan.plan_days.find((d) => d.weekday === todayWeekday);

  if (todayDay) {
    const exerciseCount = todayDay.plan_day_exercises.length;
    const totalSets = todayDay.plan_day_exercises.reduce(
      (sum, e) => sum + e.target_sets.length,
      0,
    );

    return {
      state: 'planned',
      plan: { id: activePlan.id, name: activePlan.name },
      todayDay: {
        id: todayDay.id,
        label: todayDay.day_name,
        exerciseCount,
        estimatedDuration: estimateWorkoutDuration(exerciseCount, totalSets),
      },
    };
  }

  // Rest day -- find next planned day
  const assignedDays = activePlan.plan_days
    .filter((d) => d.weekday !== null)
    .sort((a, b) => a.weekday! - b.weekday!);

  if (assignedDays.length === 0) {
    return {
      state: 'rest-day',
      plan: { id: activePlan.id, name: activePlan.name },
    };
  }

  // Find next day after today, wrapping around the week
  const nextDay =
    assignedDays.find((d) => d.weekday! > todayWeekday) ?? assignedDays[0];

  return {
    state: 'rest-day',
    plan: { id: activePlan.id, name: activePlan.name },
    nextDay: {
      label: nextDay.day_name,
      dayName: DAY_NAMES[nextDay.weekday!],
    },
  };
}

/**
 * Hook that determines today's planned workout from the active plan.
 */
export function useTodaysWorkout(): TodaysWorkoutState {
  const activePlan = usePlanStore((s) => s.plans.find((p) => p.is_active));

  return useMemo(() => {
    const today = new Date().getDay();
    return determineTodaysWorkout(activePlan ?? null, today);
  }, [activePlan]);
}
