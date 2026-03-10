import { useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import type { ProgressSummary, SparklineData } from '@/features/progress/types';

/**
 * Pure function for streak calculation. Exported for testability.
 * Streak = consecutive weeks where user completed at least one workout.
 * Current week without a workout still counts (user may work out later).
 */
export function calculateWeeklyStreak(
  sessions: { ended_at: string }[],
): number {
  if (sessions.length === 0) return 0;

  const now = new Date();

  // Get Monday-based week key (ISO week style)
  function getWeekKey(d: Date): string {
    const copy = new Date(d.getTime());
    // Adjust to Monday-based week: Sunday (0) becomes 6, Mon=0, etc.
    const dayOfWeek = copy.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    copy.setDate(copy.getDate() - mondayOffset);
    copy.setHours(0, 0, 0, 0);
    return `${copy.getFullYear()}-${copy.getMonth()}-${copy.getDate()}`;
  }

  const sessionWeeks = new Set(
    sessions.map((s) => getWeekKey(new Date(s.ended_at))),
  );

  let streak = 0;
  let weekOffset = 0;

  while (true) {
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - weekOffset * 7);
    const weekKey = getWeekKey(checkDate);

    if (sessionWeeks.has(weekKey)) {
      streak++;
      weekOffset++;
    } else if (weekOffset === 0) {
      // Current week hasn't had a workout yet -- still allow streak from previous weeks
      weekOffset++;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Get the start of the current calendar week (Monday).
 */
function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

interface SparklineMap {
  [exerciseName: string]: SparklineData[];
}

export function useProgressSummary() {
  const [summary, setSummary] = useState<ProgressSummary>({
    weeklyStreak: 0,
    recentPRs: [],
    weekWorkoutCount: 0,
    weekTotalVolume: 0,
  });
  const [sparklines, setSparklines] = useState<SparklineMap>({});
  const [isLoading, setIsLoading] = useState(true);
  const userId = useAuthStore((s) => s.userId);

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const weekStart = getWeekStart();

      // Fetch recent sessions (last 90 days) for streak calculation
      const { data: sessions } = await (supabase.from('workout_sessions') as any)
        .select('id, ended_at')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('ended_at', ninetyDaysAgo.toISOString())
        .order('ended_at', { ascending: false });

      // Fetch recent PRs (last 30 days)
      const { data: prs } = await (supabase.from('set_logs') as any)
        .select(`
          weight, unit, logged_at,
          session_exercises!inner(
            exercise_id,
            exercises!inner(name),
            workout_sessions!inner(user_id, ended_at)
          )
        `)
        .eq('is_pr', true)
        .eq('session_exercises.workout_sessions.user_id', userId)
        .gte('session_exercises.workout_sessions.ended_at', thirtyDaysAgo.toISOString())
        .order('logged_at', { ascending: false })
        .limit(5);

      // Fetch this week's session data for volume/count
      const { data: weekSessions } = await (supabase.from('workout_sessions') as any)
        .select(`
          id, ended_at,
          session_exercises(
            set_logs(weight, reps)
          )
        `)
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('ended_at', weekStart.toISOString());

      // Calculate streak
      const weeklyStreak = calculateWeeklyStreak(sessions ?? []);

      // Calculate week stats
      const weekWorkoutCount = weekSessions?.length ?? 0;
      let weekTotalVolume = 0;
      if (weekSessions) {
        for (const session of weekSessions) {
          for (const se of session.session_exercises ?? []) {
            for (const sl of se.set_logs ?? []) {
              weekTotalVolume += (Number(sl.weight) || 0) * (Number(sl.reps) || 0);
            }
          }
        }
      }

      // Map PRs
      const recentPRs = (prs ?? []).slice(0, 5).map((pr: any) => ({
        exerciseName: pr.session_exercises?.exercises?.name ?? 'Unknown',
        weight: Number(pr.weight),
        unit: pr.unit ?? 'lbs',
        date: pr.logged_at,
      }));

      setSummary({ weeklyStreak, recentPRs, weekWorkoutCount, weekTotalVolume });

      // Fetch sparklines for key lifts (bench, squat, deadlift)
      await fetchKeyLiftSparklines();
    } catch {
      // Keep existing summary on error
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchKeyLiftSparklines = useCallback(async () => {
    if (!supabase || !userId) return;

    try {
      // Search for key lifts by common names
      const keyLifts = ['Bench Press', 'Squat', 'Deadlift'];
      const sparklineMap: SparklineMap = {};

      for (const liftName of keyLifts) {
        const { data: exercises } = await (supabase.from('exercises') as any)
          .select('id, name')
          .ilike('name', `%${liftName}%`)
          .limit(1);

        if (exercises && exercises.length > 0) {
          const { data: chartData } = await (supabase.rpc as any)(
            'get_exercise_chart_data',
            {
              p_user_id: userId,
              p_exercise_id: exercises[0].id,
              p_since: null,
            },
          );

          if (chartData && chartData.length > 0) {
            // Take last 10 sessions
            sparklineMap[liftName] = chartData.slice(-10).map((r: any) => ({
              date: new Date(r.session_date).getTime(),
              value: Number(r.estimated_1rm) || 0,
            }));
          }
        }
      }

      setSparklines(sparklineMap);
    } catch {
      // Sparklines are non-critical
    }
  }, [userId]);

  return { summary, sparklines, isLoading, refresh };
}
