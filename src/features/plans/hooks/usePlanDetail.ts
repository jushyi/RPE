import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usePlanStore } from '@/stores/planStore';
import type { Plan } from '../types';

export function usePlanDetail(planId: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const updateInStore = usePlanStore((s) => s.updatePlan);

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

  /**
   * Saves the edited draft back to Supabase using delete-and-reinsert for days/exercises.
   * This is simpler than diffing individual adds/removes/edits for a v1 template editor.
   */
  const updatePlan = useCallback(
    async (draft: Plan) => {
      if (!supabase || !planId) return { success: false, error: 'Not connected' };

      setIsSaving(true);
      try {
        // 1. Update the workout_plans row (name, updated_at)
        const { error: planError } = await (supabase.from('workout_plans') as any)
          .update({ name: draft.name, updated_at: new Date().toISOString() })
          .eq('id', planId);

        if (planError) throw planError;

        // 2. Delete existing plan_days (cascade deletes plan_day_exercises)
        const { error: deleteError } = await (supabase.from('plan_days') as any)
          .delete()
          .eq('plan_id', planId);

        if (deleteError) throw deleteError;

        // 3. Insert new plan_days from draft
        if (draft.plan_days.length > 0) {
          const dayInserts = draft.plan_days.map((day, index) => ({
            plan_id: planId,
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

          // 4. Insert plan_day_exercises for each day
          const sortedDays = (dayData ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
          const allExerciseInserts: any[] = [];

          for (let i = 0; i < sortedDays.length; i++) {
            const dayExercises = draft.plan_days[i]?.plan_day_exercises ?? [];
            for (let j = 0; j < dayExercises.length; j++) {
              const ex = dayExercises[j];
              allExerciseInserts.push({
                plan_day_id: sortedDays[i].id,
                exercise_id: ex.exercise_id,
                sort_order: j,
                target_sets: ex.target_sets,
                notes: ex.notes,
                unit_override: ex.unit_override,
                weight_progression: ex.weight_progression ?? 'carry_previous',
              });
            }
          }

          if (allExerciseInserts.length > 0) {
            const { error: exError } = await (supabase.from('plan_day_exercises') as any)
              .insert(allExerciseInserts)
              .select();

            if (exError) throw exError;
          }
        }

        // 5. Update store with draft data
        updateInStore(planId, {
          name: draft.name,
          plan_days: draft.plan_days,
        });

        // 6. Refetch to get fresh data with new IDs
        await fetchPlan();

        return { success: true, error: null };
      } catch (err: any) {
        console.warn('Failed to update plan:', err);
        return { success: false, error: err?.message ?? 'Failed to save plan' };
      } finally {
        setIsSaving(false);
      }
    },
    [planId, fetchPlan, updateInStore]
  );

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return { plan, isLoading, isSaving, error, refetch: fetchPlan, updatePlan };
}
