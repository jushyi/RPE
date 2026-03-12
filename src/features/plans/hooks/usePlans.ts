import { useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usePlanStore } from '@/stores/planStore';
import { useAuthStore } from '@/stores/authStore';
import { useAlarmStore } from '@/stores/alarmStore';
import { schedulePlanAlarms, cancelPlanAlarms, syncActiveAlarms } from '@/features/alarms/hooks/useAlarmScheduler';
import type { Plan, PlanSummary, TargetSet } from '../types';

export function usePlans() {
  const {
    plans,
    isLoading,
    lastFetched,
    setPlans,
    addPlan: addToStore,
    updatePlan: updateInStore,
    removePlan: removeFromStore,
    setActivePlan: setActiveInStore,
    setLoading,
  } = usePlanStore();
  const userId = useAuthStore((s) => s.userId);
  const alarmSyncedRef = useRef(false);

  /** Summaries derived from cached plans (avoids extra queries) */
  const planSummaries: PlanSummary[] = plans.map((p) => ({
    id: p.id,
    user_id: p.user_id,
    name: p.name,
    is_active: p.is_active,
    created_at: p.created_at,
    updated_at: p.updated_at,
    day_count: p.plan_days?.length ?? 0,
    day_names: p.plan_days?.map((d) => d.day_name) ?? [],
  }));

  const fetchPlans = useCallback(async (force = false) => {
    if (!force && lastFetched && plans.length > 0) return;
    if (!supabase) return;

    // Ensure we have a valid auth session before querying (RLS requires it)
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('fetchPlans: no auth session, skipping');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await (supabase.from('workout_plans') as any)
        .select('*, plan_days(id, plan_id, day_name, weekday, alarm_time, alarm_enabled, sort_order, created_at, plan_day_exercises(id, plan_day_id, exercise_id, sort_order, target_sets, notes, unit_override, weight_progression, created_at, exercise:exercises(id, name, equipment, muscle_groups)))')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure plan_days and their exercises are always arrays and sorted
      const normalized = (data ?? []).map((p: any) => ({
        ...p,
        plan_days: (p.plan_days ?? []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        ).map((d: any) => ({
          ...d,
          plan_day_exercises: (d.plan_day_exercises ?? []).sort(
            (a: any, b: any) => a.sort_order - b.sort_order
          ),
        })),
      })) as Plan[];

      setPlans(normalized);

      // One-time alarm sync on app launch to recover lost alarms
      if (!alarmSyncedRef.current) {
        alarmSyncedRef.current = true;
        const isPaused = useAlarmStore.getState().isPaused;
        if (!isPaused) {
          syncActiveAlarms(normalized).catch((err) =>
            console.warn('Failed to sync alarms on fetch:', err)
          );
        }
      }
    } catch (err) {
      console.warn('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  }, [lastFetched, plans.length]);

  interface CreatePlanDay {
    day_name: string;
    weekday: number | null;
    alarm_time?: string | null;
    alarm_enabled?: boolean;
    exercises: {
      exercise_id: string;
      target_sets: TargetSet[];
      notes: string | null;
      unit_override: 'kg' | 'lbs' | null;
      weight_progression: 'manual' | 'carry_previous';
    }[];
  }

  const createPlan = useCallback(
    async (name: string, days: CreatePlanDay[]) => {
      if (!supabase || !userId) return;

      // Insert the plan
      const { data: planData, error: planError } = await (supabase.from('workout_plans') as any)
        .insert({ name, user_id: userId })
        .select()
        .single();

      if (planError) throw planError;

      // Insert plan days
      const dayInserts = days.map((day, index) => ({
        plan_id: planData.id,
        day_name: day.day_name,
        weekday: day.weekday,
        alarm_time: day.alarm_time ?? null,
        alarm_enabled: day.alarm_enabled ?? false,
        sort_order: index,
      }));

      const { data: dayData, error: dayError } = await (supabase.from('plan_days') as any)
        .insert(dayInserts)
        .select();

      if (dayError) throw dayError;

      // Insert exercises for each day
      const sortedDays = (dayData ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
      const allExerciseInserts: any[] = [];

      for (let i = 0; i < sortedDays.length; i++) {
        const dayExercises = days[i]?.exercises ?? [];
        for (let j = 0; j < dayExercises.length; j++) {
          const ex = dayExercises[j];
          allExerciseInserts.push({
            plan_day_id: sortedDays[i].id,
            exercise_id: ex.exercise_id,
            sort_order: j,
            target_sets: ex.target_sets,
            notes: ex.notes,
            unit_override: ex.unit_override,
            weight_progression: ex.weight_progression,
          });
        }
      }

      let exerciseData: any[] = [];
      if (allExerciseInserts.length > 0) {
        const { data: exData, error: exError } = await (supabase.from('plan_day_exercises') as any)
          .insert(allExerciseInserts)
          .select();

        if (exError) throw exError;
        exerciseData = exData ?? [];
      }

      // Build the full plan object
      const newPlan: Plan = {
        ...planData,
        plan_days: sortedDays.map((d: any) => ({
          ...d,
          plan_day_exercises: exerciseData
            .filter((e: any) => e.plan_day_id === d.id)
            .sort((a: any, b: any) => a.sort_order - b.sort_order),
        })),
      };

      addToStore(newPlan);

      // Schedule alarms if new plan is active
      if (newPlan.is_active && !useAlarmStore.getState().isPaused) {
        try {
          await schedulePlanAlarms(newPlan.plan_days);
        } catch (err) {
          console.warn('Failed to schedule alarms for new plan:', err);
        }
      }

      return newPlan;
    },
    [userId]
  );

  const deletePlan = useCallback(
    async (id: string) => {
      if (!supabase) return;

      // Cancel alarms for the plan being deleted (fire-and-forget)
      const planToDelete = plans.find((p) => p.id === id);
      if (planToDelete) {
        cancelPlanAlarms(planToDelete.plan_days).catch((err) =>
          console.warn('Failed to cancel alarms for deleted plan:', err)
        );
      }

      const { error } = await (supabase.from('workout_plans') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      removeFromStore(id);
    },
    [plans]
  );

  const setActivePlan = useCallback(
    async (id: string) => {
      if (!supabase) return;

      const { error } = await (supabase.from('workout_plans') as any)
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;
      setActiveInStore(id);

      // Sync alarms: cancel old active plan alarms, schedule new (fire-and-forget)
      const updatedPlans = usePlanStore.getState().plans;
      if (!useAlarmStore.getState().isPaused) {
        syncActiveAlarms(updatedPlans).catch((err) =>
          console.warn('Failed to sync alarms on active plan change:', err)
        );
      }
    },
    []
  );

  return {
    plans,
    planSummaries,
    isLoading,
    fetchPlans,
    createPlan,
    deletePlan,
    setActivePlan,
  };
}
