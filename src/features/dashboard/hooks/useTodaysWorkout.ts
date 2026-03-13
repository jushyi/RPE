import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
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
 * Hook that determines today's planned workout by fetching the active plan
 * directly from Supabase using the auth session's user ID (not MMKV cache).
 */
export function useTodaysWorkout(): { workout: TodaysWorkoutState; activePlan: Plan | null } {
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  // Use authStore userId only as a trigger to re-fetch when auth changes
  const userId = useAuthStore((s) => s.userId);

  useEffect(() => {
    let cancelled = false;

    if (!supabase) {
      setActivePlan(null);
      return;
    }

    (async () => {
      try {
        // Always use the live session user ID (not MMKV-cached authStore)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (!cancelled) setActivePlan(null);
          return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from('workout_plans') as any)
          .select(
            '*, plan_days(id, plan_id, day_name, weekday, sort_order, plan_day_exercises(id, plan_day_id, exercise_id, sort_order, target_sets, notes, unit_override, weight_progression, exercise:exercises(id, name, equipment, muscle_groups)))',
          )
          .eq('user_id', session.user.id)
          .eq('is_active', true)
          .limit(1)
          .single();

        if (cancelled) return;

        if (error || !data) {
          setActivePlan(null);
          return;
        }

        // Normalize sort orders (same as fetchPlans pattern)
        const normalized: Plan = {
          ...data,
          plan_days: [...data.plan_days]
            .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
            .map((day: any) => ({
              ...day,
              plan_day_exercises: [...day.plan_day_exercises].sort(
                (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
              ),
            })),
        };

        setActivePlan(normalized);
      } catch {
        if (!cancelled) setActivePlan(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const workout = useMemo(() => {
    const today = new Date().getDay();
    return determineTodaysWorkout(activePlan, today);
  }, [activePlan]);

  return { workout, activePlan };
}
