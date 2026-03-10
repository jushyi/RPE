/**
 * Storage + fetching for today's completed workout sessions.
 * Combines MMKV cache (for unsynced sessions) with Supabase (for synced ones).
 */
import { useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { createMMKV } from 'react-native-mmkv';
import { supabase } from '@/lib/supabase/client';
import type { WorkoutSession, SessionExercise, SetLog } from '@/features/workout/types';

const mmkv = createMMKV({ id: 'completed-today' });
const KEY = 'completed_sessions';

interface StoredSessions {
  date: string; // YYYY-MM-DD
  sessions: WorkoutSession[];
}

/** Append a completed session to today's MMKV cache */
export function saveCompletedSession(session: WorkoutSession): void {
  const today = new Date().toISOString().split('T')[0];
  const existing = getCachedToday();
  const sessions = [...existing, session];
  mmkv.set(KEY, JSON.stringify({ date: today, sessions }));
}

/** Get today's MMKV-cached sessions */
function getCachedToday(): WorkoutSession[] {
  const raw = mmkv.getString(KEY);
  if (!raw) return [];
  try {
    const stored: StoredSessions = JSON.parse(raw);
    const today = new Date().toISOString().split('T')[0];
    if (stored.date === today) return stored.sessions;
    return [];
  } catch {
    return [];
  }
}

/** Fetch today's completed sessions from Supabase */
async function fetchFromSupabase(): Promise<WorkoutSession[]> {
  const today = new Date().toISOString().split('T')[0];
  const startOfDay = `${today}T00:00:00.000Z`;
  const endOfDay = `${today}T23:59:59.999Z`;

  const { data: rows, error } = await (supabase as any)
    .from('workout_sessions')
    .select(`
      id,
      user_id,
      plan_id,
      plan_day_id,
      started_at,
      ended_at,
      session_exercises (
        id,
        exercise_id,
        sort_order,
        exercise:exercises ( id, name ),
        set_logs (
          id,
          set_number,
          weight,
          reps,
          unit,
          is_pr,
          logged_at
        )
      )
    `)
    .gte('started_at', startOfDay)
    .lte('started_at', endOfDay)
    .not('ended_at', 'is', null)
    .order('started_at', { ascending: true });

  if (error || !rows) return [];

  return rows.map((row: any) => {
    const exercises: SessionExercise[] = (row.session_exercises ?? [])
      .sort((a: any, b: any) => a.sort_order - b.sort_order)
      .map((se: any) => ({
        id: se.id,
        exercise_id: se.exercise_id,
        exercise_name: se.exercise?.name ?? 'Unknown',
        sort_order: se.sort_order,
        target_sets: [],
        weight_progression: 'manual' as const,
        unit: se.set_logs?.[0]?.unit ?? 'lbs',
        logged_sets: (se.set_logs ?? [])
          .sort((a: any, b: any) => a.set_number - b.set_number)
          .map((sl: any): SetLog => ({
            id: sl.id,
            set_number: sl.set_number,
            weight: Number(sl.weight),
            reps: sl.reps,
            rpe: null,
            unit: sl.unit,
            is_pr: sl.is_pr,
            logged_at: sl.logged_at,
          })),
      }));

    return {
      id: row.id,
      user_id: row.user_id,
      plan_id: row.plan_id,
      plan_day_id: row.plan_day_id,
      title: row.plan_day_id ? 'Workout' : 'Quick Workout',
      started_at: row.started_at,
      ended_at: row.ended_at,
      exercises,
    } as WorkoutSession;
  });
}

/** Remove a session from today's MMKV cache (e.g. after deletion) */
export function removeCompletedSession(sessionId: string): void {
  const today = new Date().toISOString().split('T')[0];
  const existing = getCachedToday();
  const filtered = existing.filter((s) => s.id !== sessionId);
  if (filtered.length === 0) {
    mmkv.remove(KEY);
  } else {
    mmkv.set(KEY, JSON.stringify({ date: today, sessions: filtered }));
  }
}

/** Hook that fetches from Supabase + MMKV on focus and on demand */
export function useCompletedToday(): {
  sessions: WorkoutSession[];
  refreshing: boolean;
  refresh: () => void;
} {
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => getCachedToday());
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(() => {
    setRefreshing(true);
    const cached = getCachedToday();
    setSessions(cached);

    fetchFromSupabase()
      .then((dbSessions) => {
        // Supabase is source of truth — overwrite MMKV cache and state
        const today = new Date().toISOString().split('T')[0];
        if (dbSessions.length > 0) {
          mmkv.set(KEY, JSON.stringify({ date: today, sessions: dbSessions }));
        } else {
          mmkv.remove(KEY);
        }
        setSessions(dbSessions);
      })
      .catch(() => {
        // Offline — cached sessions are fine
      })
      .finally(() => setRefreshing(false));
  }, []);

  useFocusEffect(refresh);

  return { sessions, refreshing, refresh };
}
