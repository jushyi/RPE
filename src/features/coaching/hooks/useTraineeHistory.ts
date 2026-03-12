import { useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface TraineeSession {
  id: string;
  title: string;
  started_at: string;
  ended_at: string | null;
  plan_name: string | null;
  session_exercises: {
    id: string;
    exercise_id: string;
    exercise_name: string;
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

  const fetchSessions = useCallback(async (reset = true) => {
    if (!supabase || !traineeId) return;

    setIsLoading(true);
    try {
      const offset = reset ? 0 : sessions.length;

      const { data, error } = await (supabase.from('workout_sessions') as any)
        .select('id, title, started_at, ended_at, plan_name, session_exercises(id, exercise_id, exercise_name, set_logs(weight, reps, unit))')
        .eq('user_id', traineeId)
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      const items = (data ?? []) as TraineeSession[];
      setHasMore(items.length === PAGE_SIZE);

      if (reset) {
        setSessions(items);
      } else {
        setSessions((prev) => [...prev, ...items]);
      }
    } catch (err) {
      console.warn('Failed to fetch trainee history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [traineeId, sessions.length]);

  const fetchMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchSessions(false);
    }
  }, [isLoading, hasMore, fetchSessions]);

  return { sessions, isLoading, hasMore, fetchSessions, fetchMore };
}
