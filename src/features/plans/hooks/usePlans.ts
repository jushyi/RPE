import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usePlanStore } from '@/stores/planStore';
import { useAuthStore } from '@/stores/authStore';
import type { Plan, PlanSummary } from '../types';

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

  const createPlan = useCallback(
    async (name: string, dayNames: string[]) => {
      if (!supabase || !userId) return;

      // Insert the plan
      const { data: planData, error: planError } = await (supabase.from('workout_plans') as any)
        .insert({ name, user_id: userId })
        .select()
        .single();

      if (planError) throw planError;

      // Insert plan days
      const dayInserts = dayNames.map((dayName, index) => ({
        plan_id: planData.id,
        day_name: dayName,
        sort_order: index,
      }));

      const { data: dayData, error: dayError } = await (supabase.from('plan_days') as any)
        .insert(dayInserts)
        .select();

      if (dayError) throw dayError;

      const newPlan: Plan = {
        ...planData,
        plan_days: (dayData ?? []).map((d: any) => ({
          ...d,
          plan_day_exercises: [],
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
