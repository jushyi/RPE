import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { getTimeRangeStart } from '../utils/chartHelpers';
import type { ChartPoint, TimeRange } from '../types';

export function useExerciseChartData(exerciseId: string, timeRange: TimeRange) {
  const [data, setData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useAuthStore((s) => s.userId);

  const fetchData = useCallback(async () => {
    if (!supabase || !userId || !exerciseId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const since = getTimeRangeStart(timeRange);

      const { data: rows, error } = await (supabase.rpc as any)(
        'get_exercise_chart_data',
        {
          p_user_id: userId,
          p_exercise_id: exerciseId,
          p_since: since?.toISOString() ?? null,
        },
      );

      if (!error && rows) {
        setData(
          rows.map((r: any) => ({
            date: new Date(r.session_date).getTime(),
            estimated_1rm: Number(r.estimated_1rm) || 0,
            max_weight: Number(r.max_weight) || 0,
            total_volume: Number(r.total_volume) || 0,
          })),
        );
      } else {
        setData([]);
      }
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [userId, exerciseId, timeRange]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, refetch: fetchData };
}
