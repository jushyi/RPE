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
      started_at: row.started_at,
      ended_at: row.ended_at,
      exercises,
    } as WorkoutSession;
  });
}

/** Merge DB and MMKV sessions, deduplicating by ID */
function mergeSessions(dbSessions: WorkoutSession[], cachedSessions: WorkoutSession[]): WorkoutSession[] {
  const seen = new Set(dbSessions.map((s) => s.id));
  const merged = [...dbSessions];
  for (const s of cachedSessions) {
    if (!seen.has(s.id)) {
      merged.push(s);
    }
  }
  merged.sort((a, b) => a.started_at.localeCompare(b.started_at));
  return merged;
}

/** Hook that fetches from Supabase + MMKV on focus */
export function useCompletedToday(): WorkoutSession[] {
  const [sessions, setSessions] = useState<WorkoutSession[]>(() => getCachedToday());

  useFocusEffect(
    useCallback(() => {
      const cached = getCachedToday();
      setSessions(cached);

      fetchFromSupabase()
        .then((dbSessions) => {
          setSessions((prev) => mergeSessions(dbSessions, prev));
        })
        .catch(() => {
          // Offline — cached sessions are fine
        });
    }, [])
  );

  return sessions;
}
