import { useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useHistoryStore } from '@/stores/historyStore';
import { useAuthStore } from '@/stores/authStore';
import { calculateTotalVolume, calculateDurationMinutes } from '../utils/volumeCalc';
import { removeCompletedSession } from '@/features/workout/hooks/useCompletedToday';
import type { HistorySession, SessionListItem } from '../types';

const PAGE_SIZE = 30;

export function useHistory() {
  const { sessions, isLoading, lastFetched, setSessions, removeSession, setLoading } =
    useHistoryStore();
  const userId = useAuthStore((s) => s.userId);

  /**
   * Fetch sessions with nested exercise names from Supabase.
   * Lightweight query -- does not include individual set data (that's for detail view).
   */
  const fetchSessions = useCallback(
    async (force = false, offset = 0) => {
      if (!force && offset === 0 && lastFetched && sessions.length > 0) return;
      if (!supabase) return;

      setLoading(true);
      try {
        const { data, error } = await (supabase.from('workout_sessions') as any)
          .select(
            `
            *,
            session_exercises(
              id,
              exercise_id,
              sort_order,
              exercises(name, muscle_groups),
              set_logs(id, weight, reps, is_pr, estimated_1rm, video_url)
            ),
            workout_plans(name)
          `
          )
          .eq('user_id', userId)
          .order('ended_at', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);

        if (error) throw error;

        const normalized = (data ?? []).map((s: any) => ({
          ...s,
          plan_name: s.workout_plans?.name ?? null,
          session_exercises: (s.session_exercises ?? [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((se: any) => ({
              ...se,
              exercise: se.exercises ?? { name: 'Unknown', muscle_groups: [], equipment: '', track_prs: false },
            })),
        })) as HistorySession[];

        if (offset === 0) {
          setSessions(normalized);
        } else {
          // Append for pagination, deduplicating by id
          const existingIds = new Set(sessions.map((s) => s.id));
          const newSessions = normalized.filter((s) => !existingIds.has(s.id));
          setSessions([...sessions, ...newSessions]);
        }
      } catch (err) {
        console.warn('Failed to fetch history sessions:', err);
      } finally {
        setLoading(false);
      }
    },
    [lastFetched, sessions.length, userId]
  );

  /**
   * Delete a session and cascade-delete children via FK constraints.
   */
  const deleteSession = useCallback(
    async (id: string) => {
      if (!supabase) return;

      const { error } = await (supabase.from('workout_sessions') as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      removeSession(id);
      removeCompletedSession(id);
    },
    []
  );

  /**
   * Derive a SessionListItem from a HistorySession for list display.
   * Truncates exercise names to first 2 with "+N more" suffix.
   */
  const toListItem = useCallback((session: HistorySession): SessionListItem => {
    const exerciseNames = session.session_exercises.map(
      (se) => se.exercise?.name ?? 'Unknown'
    );

    const allSets = session.session_exercises.flatMap((se) => se.set_logs ?? []);
    const prCount = allSets.filter((s) => s.is_pr).length;
    const totalVolume = calculateTotalVolume(session.session_exercises);
    const durationMinutes = calculateDurationMinutes(
      session.started_at,
      session.ended_at
    );

    const hasVideo = allSets.some((s) => !!s.video_url);

    return {
      id: session.id,
      date: session.ended_at ?? session.started_at,
      exerciseNames,
      totalVolume,
      prCount,
      durationMinutes,
      planName: session.plan_name ?? null,
      dayName: session.day_name ?? null,
      hasVideo,
    };
  }, []);

  return {
    sessions,
    isLoading,
    fetchSessions,
    deleteSession,
    toListItem,
  };
}
