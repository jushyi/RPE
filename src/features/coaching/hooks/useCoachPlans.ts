import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { Plan, TargetSet } from '@/features/plans/types';

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

export function useCoachPlans(traineeId: string) {
  const userId = useAuthStore((s) => s.userId);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch all plans for the trainee (both coach-created and personal).
   */
  const fetchTraineePlans = useCallback(async () => {
    if (!supabase || !traineeId) return;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from('workout_plans') as any)
        .select('*, plan_days(id, plan_id, day_name, weekday, alarm_time, alarm_enabled, sort_order, created_at, plan_day_exercises(id, plan_day_id, exercise_id, sort_order, target_sets, notes, unit_override, weight_progression, created_at, exercise:exercises(id, name, equipment, muscle_groups)))')
        .eq('user_id', traineeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const normalized = (data ?? []).map((p: any) => ({
        ...p,
        plan_days: (p.plan_days ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((d: any) => ({
            ...d,
            plan_day_exercises: (d.plan_day_exercises ?? [])
              .sort((a: any, b: any) => a.sort_order - b.sort_order),
          })),
      })) as Plan[];

      setPlans(normalized);
    } catch (err) {
      console.warn('Failed to fetch trainee plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [traineeId]);

  /**
   * Create a plan for the trainee. Sets user_id = traineeId, coach_id = current user.
   * Does NOT schedule alarms (trainee sets own alarms).
   */
  const createPlanForTrainee = useCallback(
    async (name: string, days: CreatePlanDay[], note?: string) => {
      if (!supabase || !userId || !traineeId) return;

      // Insert the plan with trainee as owner, current user as coach
      const { data: planData, error: planError } = await (supabase.from('workout_plans') as any)
        .insert({ name, user_id: traineeId, coach_id: userId })
        .select()
        .single();

      if (planError) throw planError;

      // Insert plan days (no alarm fields -- trainee sets own alarms)
      const dayInserts = days.map((day, index) => ({
        plan_id: planData.id,
        day_name: day.day_name,
        weekday: day.weekday,
        alarm_time: null,
        alarm_enabled: false,
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

      if (allExerciseInserts.length > 0) {
        const { error: exError } = await (supabase.from('plan_day_exercises') as any)
          .insert(allExerciseInserts)
          .select();

        if (exError) throw exError;
      }

      // Insert coach note if provided
      if (note?.trim()) {
        await (supabase.from('coach_notes') as any)
          .insert({
            plan_id: planData.id,
            coach_id: userId,
            note: note.trim(),
          });
      }

      // Refresh plans list
      await fetchTraineePlans();
    },
    [userId, traineeId, fetchTraineePlans]
  );

  /**
   * Update a coach-owned plan (delete-and-reinsert approach).
   * Only works on plans where coach_id = current userId.
   */
  const updateTraineePlan = useCallback(
    async (planId: string, name: string, days: CreatePlanDay[], note?: string) => {
      if (!supabase || !userId) return;

      // Update plan name
      const { error: planError } = await (supabase.from('workout_plans') as any)
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', planId)
        .eq('coach_id', userId);

      if (planError) throw planError;

      // Delete existing plan_days (cascades to exercises)
      const { error: deleteError } = await (supabase.from('plan_days') as any)
        .delete()
        .eq('plan_id', planId);

      if (deleteError) throw deleteError;

      // Re-insert days
      if (days.length > 0) {
        const dayInserts = days.map((day, index) => ({
          plan_id: planId,
          day_name: day.day_name,
          weekday: day.weekday,
          alarm_time: null,
          alarm_enabled: false,
          sort_order: index,
        }));

        const { data: dayData, error: dayError } = await (supabase.from('plan_days') as any)
          .insert(dayInserts)
          .select();

        if (dayError) throw dayError;

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

        if (allExerciseInserts.length > 0) {
          const { error: exError } = await (supabase.from('plan_day_exercises') as any)
            .insert(allExerciseInserts)
            .select();

          if (exError) throw exError;
        }
      }

      // Insert coach note if provided
      if (note?.trim()) {
        await (supabase.from('coach_notes') as any)
          .insert({
            plan_id: planId,
            coach_id: userId,
            note: note.trim(),
          });
      }

      // Refresh plans list
      await fetchTraineePlans();
    },
    [userId, fetchTraineePlans]
  );

  /**
   * Delete a coach-owned plan.
   */
  const deleteTraineePlan = useCallback(
    async (planId: string) => {
      if (!supabase || !userId) return;

      const { error } = await (supabase.from('workout_plans') as any)
        .delete()
        .eq('id', planId)
        .eq('coach_id', userId);

      if (error) throw error;

      setPlans((prev) => prev.filter((p) => p.id !== planId));
    },
    [userId]
  );

  return {
    plans,
    isLoading,
    fetchTraineePlans,
    createPlanForTrainee,
    updateTraineePlan,
    deleteTraineePlan,
  };
}
