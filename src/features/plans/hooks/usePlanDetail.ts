import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { usePlanStore } from '@/stores/planStore';
import { useAlarmStore } from '@/stores/alarmStore';
import { cancelPlanAlarms, schedulePlanAlarms } from '@/features/alarms/hooks/useAlarmScheduler';
import type { Plan } from '../types';

export function usePlanDetail(planId: string) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const updateInStore = usePlanStore((s) => s.updatePlan);

  const fetchPlan = useCallback(async (silent = false) => {
    if (!supabase || !planId) return;

    if (!silent) setIsLoading(true);
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
   * Saves the edited draft back to Supabase using a diff strategy that preserves
   * existing plan_day IDs. This prevents FK violations when in-flight workouts
   * reference a plan_day_id that would otherwise be deleted and recreated.
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

        // 2. Fetch current day IDs from DB to diff against draft
        const { data: existingDays, error: fetchDaysErr } = await (supabase.from('plan_days') as any)
          .select('id')
          .eq('plan_id', planId);

        if (fetchDaysErr) throw fetchDaysErr;

        const existingDayIds = new Set<string>((existingDays ?? []).map((d: any) => d.id));
        const draftDayIds = new Set<string>(draft.plan_days.map((d) => d.id).filter(Boolean));

        // 3. Delete days that were removed from the draft (cascade deletes their exercises)
        const daysToDelete = [...existingDayIds].filter((id: string) => !draftDayIds.has(id));
        if (daysToDelete.length > 0) {
          const { error: deleteErr } = await (supabase.from('plan_days') as any)
            .delete()
            .in('id', daysToDelete);
          if (deleteErr) throw deleteErr;
        }

        // 4. Upsert days: update existing, insert new
        const dayUpserts: any[] = [];
        const newDays: { index: number; data: any }[] = [];

        for (let i = 0; i < draft.plan_days.length; i++) {
          const day = draft.plan_days[i];
          const dayPayload = {
            plan_id: planId,
            day_name: day.day_name,
            weekday: day.weekday,
            alarm_time: day.alarm_time ?? null,
            alarm_enabled: day.alarm_enabled ?? false,
            sort_order: i,
          };

          if (day.id && existingDayIds.has(day.id)) {
            // Existing day — update in place, preserving the ID
            dayUpserts.push({ id: day.id, ...dayPayload });
          } else {
            // New day — insert without ID
            newDays.push({ index: i, data: dayPayload });
          }
        }

        // Update existing days
        if (dayUpserts.length > 0) {
          const { error: upsertErr } = await (supabase.from('plan_days') as any)
            .upsert(dayUpserts);
          if (upsertErr) throw upsertErr;
        }

        // Insert new days and capture their generated IDs
        const newDayIdMap = new Map<number, string>(); // draft index -> new DB id
        if (newDays.length > 0) {
          const { data: insertedDays, error: insertErr } = await (supabase.from('plan_days') as any)
            .insert(newDays.map((d) => d.data))
            .select();
          if (insertErr) throw insertErr;

          // Map by sort_order back to draft index
          const sorted = (insertedDays ?? []).sort((a: any, b: any) => a.sort_order - b.sort_order);
          const sortedNewDays = newDays.sort((a, b) => a.index - b.index);
          for (let j = 0; j < sortedNewDays.length; j++) {
            newDayIdMap.set(sortedNewDays[j].index, sorted[j].id);
          }
        }

        // 5. Build day ID lookup for exercise upserts
        const dayIdForIndex = (i: number): string => {
          const day = draft.plan_days[i];
          if (day.id && existingDayIds.has(day.id)) return day.id;
          return newDayIdMap.get(i) ?? '';
        };

        // 6. For each day, diff exercises
        for (let i = 0; i < draft.plan_days.length; i++) {
          const dayId = dayIdForIndex(i);
          if (!dayId) continue;

          const draftExercises = draft.plan_days[i].plan_day_exercises ?? [];

          // Fetch existing exercises for this day
          const { data: existingExercises } = await (supabase.from('plan_day_exercises') as any)
            .select('id')
            .eq('plan_day_id', dayId);

          const existingExIds = new Set<string>((existingExercises ?? []).map((e: any) => e.id));
          const draftExIds = new Set<string>(draftExercises.map((e) => e.id).filter(Boolean));

          // Delete removed exercises
          const exercisesToDelete = [...existingExIds].filter((id: string) => !draftExIds.has(id));
          if (exercisesToDelete.length > 0) {
            await (supabase.from('plan_day_exercises') as any)
              .delete()
              .in('id', exercisesToDelete);
          }

          // Upsert existing + insert new exercises
          const exUpserts: any[] = [];
          const exInserts: any[] = [];

          for (let j = 0; j < draftExercises.length; j++) {
            const ex = draftExercises[j];
            const exPayload = {
              plan_day_id: dayId,
              exercise_id: ex.exercise_id,
              sort_order: j,
              target_sets: ex.target_sets,
              notes: ex.notes,
              unit_override: ex.unit_override,
              weight_progression: ex.weight_progression ?? 'carry_previous',
            };

            if (ex.id && existingExIds.has(ex.id)) {
              exUpserts.push({ id: ex.id, ...exPayload });
            } else {
              exInserts.push(exPayload);
            }
          }

          if (exUpserts.length > 0) {
            const { error: exUpErr } = await (supabase.from('plan_day_exercises') as any)
              .upsert(exUpserts);
            if (exUpErr) throw exUpErr;
          }

          if (exInserts.length > 0) {
            const { error: exInErr } = await (supabase.from('plan_day_exercises') as any)
              .insert(exInserts);
            if (exInErr) throw exInErr;
          }
        }

        // 7. Update store with draft data
        updateInStore(planId, {
          name: draft.name,
          plan_days: draft.plan_days,
        });

        // 8. Refetch to get fresh data with correct IDs (silent — no loading spinner)
        await fetchPlan(true);

        // 9. Reschedule alarms if this is the active plan
        try {
          const allPlans = usePlanStore.getState().plans;
          const currentPlan = allPlans.find((p) => p.id === planId);
          if (currentPlan?.is_active && !useAlarmStore.getState().isPaused) {
            await cancelPlanAlarms(currentPlan.plan_days);
            await schedulePlanAlarms(currentPlan.plan_days);
          }
        } catch (alarmErr) {
          console.warn('Failed to reschedule alarms after plan edit:', alarmErr);
        }

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

  const updateDayWeekday = useCallback(
    (dayId: string, weekday: number) => {
      // Optimistic local update
      setPlan((prev) => {
        if (!prev) return prev;
        const updated: Plan = {
          ...prev,
          plan_days: prev.plan_days.map((d) =>
            d.id === dayId ? { ...d, weekday } : d
          ),
        };
        // Sync to MMKV store
        updateInStore(prev.id, { plan_days: updated.plan_days });
        return updated;
      });

      // Fire-and-forget DB update
      (supabase.from('plan_days') as any)
        .update({ weekday })
        .eq('id', dayId)
        .then(({ error: dbErr }: any) => {
          if (dbErr) console.warn('Failed to update weekday:', dbErr);
        });
    },
    [updateInStore]
  );

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return { plan, isLoading, isSaving, error, refetch: fetchPlan, updatePlan, updateDayWeekday };
}
