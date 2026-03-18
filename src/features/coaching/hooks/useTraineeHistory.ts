import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface TraineeSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  plan_id: string | null;
  plan_day_id: string | null;
  workout_plans: { name: string } | null;
  plan_days: { day_name: string } | null;
  session_exercises: {
    id: string;
    exercise_id: string;
    exercises: { name: string } | null;
    set_logs: {
      weight: number;
      reps: number;
      unit: string;
    }[];
  }[];
}

const PAGE_SIZE = 20;

/**
 * Fetches the trainee's full workout session history with pagination.
 * Used by the coach to review trainee's workout data.
 */
export function useTraineeHistory(traineeId: string) {
  const [sessions, setSessions] = useState<TraineeSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);

  const fetchSessions = useCallback(async (reset = true) => {
    if (!supabase || !traineeId) return;

    setIsLoading(true);
    try {
      if (reset) offsetRef.current = 0;
      const offset = offsetRef.current;

      const { data, error } = await (supabase.from('workout_sessions') as any)
        .select('id, started_at, ended_at, plan_id, plan_day_id, workout_plans(name), plan_days(day_name), session_exercises(id, exercise_id, exercises(name), set_logs(weight, reps, unit))')
        .eq('user_id', traineeId)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const items = (data ?? []) as TraineeSession[];
      setHasMore(items.length === PAGE_SIZE);

      if (reset) {
        setSessions(items);
        offsetRef.current = items.length;
      } else {
        setSessions((prev) => [...prev, ...items]);
        offsetRef.current += items.length;
      }
    } catch (err) {
      console.warn('Failed to fetch trainee history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [traineeId]);

  const fetchMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchSessions(false);
    }
  }, [isLoading, hasMore, fetchSessions]);

  return { sessions, isLoading, hasMore, fetchSessions, fetchMore };
}
