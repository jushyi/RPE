import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { calculateWeeklyStreak } from '@/features/dashboard/hooks/useProgressSummary';
import type { WeeklySummary, WeeklyDay, WeeklySession, WeeklyExercise } from '../types';

const DAY_LABELS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getWeekEnd(weekStart: Date): Date {
  const sunday = new Date(weekStart);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return sunday;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function formatDateLabel(d: Date): string {
  return `${MONTH_LABELS[d.getMonth()]} ${d.getDate()}`;
}

export function useWeeklyStats() {
  const [stats, setStats] = useState<WeeklySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const userId = useAuthStore((s) => s.userId);

  const refresh = useCallback(async () => {
    if (!supabase || !userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const weekStart = getWeekStart();
      const weekEnd = getWeekEnd(weekStart);
      const today = new Date();

      // Fetch this week's sessions with full exercise/set data
      const { data: sessions } = await (supabase.from('workout_sessions') as any)
        .select(`
          id, started_at, ended_at, plan_id,
          session_exercises(
            sort_order,
            exercises!inner(name, muscle_groups),
            set_logs(set_number, weight, reps, unit, is_pr)
          ),
          training_plans(name),
          plan_days(label)
        `)
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('ended_at', weekStart.toISOString())
        .lte('ended_at', weekEnd.toISOString())
        .order('ended_at', { ascending: true });

      // Fetch last 90 days for streak
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data: streakSessions } = await (supabase.from('workout_sessions') as any)
        .select('ended_at')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('ended_at', ninetyDaysAgo.toISOString());

      const weeklyStreak = calculateWeeklyStreak(streakSessions ?? []);

      // Build day-by-day structure
      const days: WeeklyDay[] = [];
      const muscleGroupCounts: Record<string, number> = {};
      let totalVolume = 0;
      let totalPRs = 0;
      let totalExercises = 0;
      const durations: number[] = [];

      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);

        const daySessions: WeeklySession[] = [];

        for (const raw of sessions ?? []) {
          const endedAt = new Date(raw.ended_at);
          if (!isSameDay(endedAt, dayDate)) continue;

          const exercises: WeeklyExercise[] = [];
          let sessionVolume = 0;
          let sessionPRs = 0;

          const sortedExercises = [...(raw.session_exercises ?? [])].sort(
            (a: any, b: any) => a.sort_order - b.sort_order,
          );

          for (const se of sortedExercises) {
            const exName = se.exercises?.name ?? 'Unknown';
            const exMuscles: string[] = se.exercises?.muscle_groups ?? [];
            const sets = (se.set_logs ?? []).map((sl: any) => ({
              setNumber: sl.set_number,
              weight: Number(sl.weight) || 0,
              reps: Number(sl.reps) || 0,
              unit: sl.unit ?? 'lbs',
              isPR: sl.is_pr ?? false,
            }));

            let exVolume = 0;
            for (const s of sets) {
              exVolume += s.weight * s.reps;
              if (s.isPR) sessionPRs++;
            }

            for (const mg of exMuscles) {
              muscleGroupCounts[mg] = (muscleGroupCounts[mg] ?? 0) + 1;
            }

            exercises.push({
              name: exName,
              muscleGroups: exMuscles,
              sets,
              totalVolume: exVolume,
            });
            sessionVolume += exVolume;
            totalExercises++;
          }

          let durationMinutes: number | null = null;
          if (raw.started_at && raw.ended_at) {
            const diffMs = new Date(raw.ended_at).getTime() - new Date(raw.started_at).getTime();
            durationMinutes = Math.round(diffMs / 60000);
            if (durationMinutes > 0) durations.push(durationMinutes);
          }

          daySessions.push({
            id: raw.id,
            startedAt: raw.started_at,
            endedAt: raw.ended_at,
            durationMinutes,
            planName: raw.training_plans?.name ?? null,
            dayName: raw.plan_days?.label ?? null,
            exercises,
            totalVolume: sessionVolume,
            prCount: sessionPRs,
          });

          totalVolume += sessionVolume;
          totalPRs += sessionPRs;
        }

        const dayVolume = daySessions.reduce((sum, s) => sum + s.totalVolume, 0);
        const dayPRs = daySessions.reduce((sum, s) => sum + s.prCount, 0);

        days.push({
          date: dayDate,
          dayLabel: DAY_LABELS_SHORT[i],
          dayFull: DAY_LABELS_FULL[i],
          dateLabel: formatDateLabel(dayDate),
          sessions: daySessions,
          totalVolume: dayVolume,
          prCount: dayPRs,
          isToday: isSameDay(dayDate, today),
        });
      }

      const totalWorkouts = (sessions ?? []).length;
      const avgDurationMinutes = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null;

      setStats({
        weekStart,
        weekEnd,
        totalWorkouts,
        totalVolume,
        totalPRs,
        totalExercises,
        avgDurationMinutes,
        weeklyStreak,
        days,
        muscleGroupCounts,
      });
    } catch {
      // Keep existing stats on error
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return { stats, isLoading, refresh };
}
