import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Plan } from '../types';

export function usePlanDetail(planId: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async () => {
    if (!supabase || !planId) return;

    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await (supabase.from('workout_plans') as any)
        .select(
          '*, plan_days(*, plan_day_exercises(*, exercise:exercises(id, name, muscle_groups, equipment)))'
        )
        .eq('id', planId)
        .single();

      if (fetchError) throw fetchError;
      if (!data) {
        setError('Plan not found');
        setPlan(null);
        return;
      }

      // Sort plan_days by sort_order, and exercises within each day
      const normalized: Plan = {
        ...data,
        plan_days: (data.plan_days ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((d: any) => ({
            ...d,
            plan_day_exercises: (d.plan_day_exercises ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order),
          })),
      };

      setPlan(normalized);
    } catch (err: any) {
      console.warn('Failed to fetch plan detail:', err);
      setError(err?.message ?? 'Failed to load plan');
    } finally {
      setIsLoading(false);
    }
  }, [planId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return { plan, isLoading, error, refetch: fetchPlan };
}
