import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface ExercisePerformance {
  bestWeight: number;
  bestReps: number;
  totalSets: number;
  unit: string;
}

/**
 * Fetches the trainee's most recent workout data for each exercise within the last 7 days.
 * Returns a Map<exerciseId, ExercisePerformance>.
 */
export function useTraineePerformance(traineeId: string, exerciseIds: string[]) {
  const [performanceMap, setPerformanceMap] = useState<Map<string, ExercisePerformance>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const prevKeyRef = useRef('');

  const fetchPerformance = useCallback(async () => {
    if (!supabase || !traineeId || exerciseIds.length === 0) {
      setPerformanceMap(new Map());
      return;
    }

    setIsLoading(true);
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Query workout_sessions for trainee in last 7 days, with session_exercises and set_logs
      const { data, error } = await (supabase.from('workout_sessions') as any)
        .select('id, session_exercises(id, exercise_id, set_logs(weight, reps, unit))')
        .eq('user_id', traineeId)
        .gte('ended_at', sevenDaysAgo)
        .not('ended_at', 'is', null);

      if (error) throw error;

      const map = new Map<string, ExercisePerformance>();

      for (const session of data ?? []) {
        for (const se of session.session_exercises ?? []) {
          if (!exerciseIds.includes(se.exercise_id)) continue;

          const sets = se.set_logs ?? [];
          if (sets.length === 0) continue;

          const existing = map.get(se.exercise_id);
          let bestWeight = existing?.bestWeight ?? 0;
          let bestReps = existing?.bestReps ?? 0;
          let totalSets = existing?.totalSets ?? 0;
          let unit = existing?.unit ?? 'lbs';

          for (const set of sets) {
            if (set.weight > bestWeight) {
              bestWeight = set.weight;
              unit = set.unit ?? 'lbs';
            }
            if (set.reps > bestReps) bestReps = set.reps;
            totalSets++;
          }

          map.set(se.exercise_id, { bestWeight, bestReps, totalSets, unit });
        }
      }

      setPerformanceMap(map);
    } catch (err) {
      console.warn('Failed to fetch trainee performance:', err);
    } finally {
      setIsLoading(false);
    }
  }, [traineeId, exerciseIds]);

  // Auto-fetch when traineeId or exerciseIds change
  useEffect(() => {
    const key = `${traineeId}:${exerciseIds.sort().join(',')}`;
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;
    fetchPerformance();
  }, [traineeId, exerciseIds, fetchPerformance]);

  return { performanceMap, isLoading };
}
