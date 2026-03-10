import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { HistorySession, HistoryExercise, ExerciseDelta } from '../types';

export function useSessionDetail() {
  const [session, setSession] = useState<HistorySession | null>(null);
  const [previousSession, setPreviousSession] = useState<HistorySession | null>(null);
  const [deltas, setDeltas] = useState<ExerciseDelta[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch a single session with full nested data including set_logs.
   */
  const fetchSession = useCallback(async (id: string) => {
    if (!supabase) return null;

    setIsLoading(true);
    try {
      const { data, error } = await (supabase.from('workout_sessions') as any)
        .select(
          `
          *,
          session_exercises(
            *,
            exercises(name, muscle_groups, equipment, track_prs),
            set_logs(*)
          ),
          workout_plans(name),
          plan_days(day_name)
        `
        )
        .eq('id', id)
        .single();

      if (error) throw error;

      const normalized: HistorySession = {
        ...data,
        plan_name: data.workout_plans?.name ?? null,
        day_name: data.plan_days?.day_name ?? null,
        session_exercises: (data.session_exercises ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order)
          .map((se: any) => ({
            ...se,
            exercise: se.exercises ?? { name: 'Unknown', muscle_groups: [], equipment: '', track_prs: false },
            set_logs: (se.set_logs ?? []).sort(
              (a: any, b: any) => a.set_number - b.set_number
            ),
          })),
      };

      setSession(normalized);

      // Fetch previous session for delta comparison if plan-based
      if (normalized.plan_day_id) {
        const prev = await fetchPreviousSession(
          normalized.plan_day_id,
          normalized.id,
          normalized.started_at
        );
        setPreviousSession(prev);

        if (prev) {
          const computed = calculateDeltas(
            normalized.session_exercises,
            prev.session_exercises
          );
          setDeltas(computed);
        }
      }

      return normalized;
    } catch (err) {
      console.warn('Failed to fetch session detail:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch the most recent previous session for the same plan day.
   * Returns null for freestyle sessions (planDayId is null).
   */
  const fetchPreviousSession = useCallback(
    async (
      planDayId: string,
      currentSessionId: string,
      sessionDate: string
    ): Promise<HistorySession | null> => {
      if (!supabase || !planDayId) return null;

      try {
        const { data, error } = await (supabase.from('workout_sessions') as any)
          .select(
            `
            *,
            session_exercises(
              *,
              exercises(name, muscle_groups, equipment, track_prs),
              set_logs(*)
            )
          `
          )
          .eq('plan_day_id', planDayId)
          .neq('id', currentSessionId)
          .lt('started_at', sessionDate)
          .order('started_at', { ascending: false })
          .limit(1)
          .single();

        if (error) return null;
        return data as HistorySession;
      } catch {
        return null;
      }
    },
    []
  );

  /**
   * Compute ExerciseDelta[] comparing max weight and total reps per exercise.
   */
  const calculateDeltas = useCallback(
    (
      currentExercises: HistoryExercise[],
      previousExercises: HistoryExercise[]
    ): ExerciseDelta[] => {
      return currentExercises.map((current) => {
        const previous = previousExercises.find(
          (prev) => prev.exercise_id === current.exercise_id
        );

        if (!previous || !previous.set_logs?.length) {
          return {
            exerciseId: current.exercise_id,
            weightDelta: 0,
            repsDelta: 0,
            hasPrevious: false,
          };
        }

        const currentSets = current.set_logs ?? [];
        const previousSets = previous.set_logs ?? [];

        const currentMaxWeight = currentSets.length
          ? Math.max(...currentSets.map((s) => s.weight))
          : 0;
        const previousMaxWeight = previousSets.length
          ? Math.max(...previousSets.map((s) => s.weight))
          : 0;

        const currentTotalReps = currentSets.reduce(
          (sum, s) => sum + s.reps,
          0
        );
        const previousTotalReps = previousSets.reduce(
          (sum, s) => sum + s.reps,
          0
        );

        return {
          exerciseId: current.exercise_id,
          weightDelta: currentMaxWeight - previousMaxWeight,
          repsDelta: currentTotalReps - previousTotalReps,
          hasPrevious: true,
        };
      });
    },
    []
  );

  /**
   * Delete an individual set from set_logs.
   */
  const deleteSet = useCallback(
    async (setId: string, sessionExerciseId: string) => {
      if (!supabase) return;

      const { error } = await (supabase.from('set_logs') as any)
        .delete()
        .eq('id', setId);

      if (error) throw error;

      // Update local state: remove the set from the exercise
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          session_exercises: prev.session_exercises.map((se) => {
            if (se.id !== sessionExerciseId) return se;
            return {
              ...se,
              set_logs: se.set_logs.filter((sl) => sl.id !== setId),
            };
          }),
        };
      });
    },
    []
  );

  const deleteExercise = useCallback(
    async (sessionExerciseId: string) => {
      if (!supabase) return;

      const { error: setsError } = await (supabase.from('set_logs') as any)
        .delete()
        .eq('session_exercise_id', sessionExerciseId);
      if (setsError) throw setsError;

      const { error } = await (supabase.from('session_exercises') as any)
        .delete()
        .eq('id', sessionExerciseId);
      if (error) throw error;

      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          session_exercises: prev.session_exercises.filter(
            (se) => se.id !== sessionExerciseId
          ),
        };
      });
    },
    []
  );

  return {
    session,
    previousSession,
    deltas,
    isLoading,
    fetchSession,
    fetchPreviousSession,
    calculateDeltas,
    deleteSet,
    deleteExercise,
  };
}
