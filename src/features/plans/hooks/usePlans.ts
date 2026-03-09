import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usePlanStore } from '@/stores/planStore';
import { useAuthStore } from '@/stores/authStore';
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

    setLoading(true);
    try {
      const { data, error } = await (supabase.from('workout_plans') as any)
        .select('*, plan_days(id, plan_id, day_name, weekday, sort_order, created_at)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Ensure plan_days is always an array and sorted
      const normalized = (data ?? []).map((p: any) => ({
        ...p,
        plan_days: (p.plan_days ?? []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        ).map((d: any) => ({ ...d, plan_day_exercises: [] })),
      })) as Plan[];

      setPlans(normalized);
    } catch (err) {
      console.warn('Failed to fetch plans:', err);
    } finally {
      setLoading(false);
    }
  }, [lastFetched, plans.length]);

  interface CreatePlanDay {
    day_name: string;
    weekday: number | null;
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
      return newPlan;
    },
    [userId]
  );

  const deletePlan = useCallback(
    async (id: string) => {
      if (!supabase) return;

      const { error } = await (supabase.from('workout_plans') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      removeFromStore(id);
    },
    []
  );

  const setActivePlan = useCallback(
    async (id: string) => {
      if (!supabase) return;

      const { error } = await (supabase.from('workout_plans') as any)
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;
      setActiveInStore(id);
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
