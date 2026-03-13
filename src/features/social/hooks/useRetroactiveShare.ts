/**
 * useRetroactiveShare — fetches a historical session's shareable data.
 *
 * Takes a sessionId, queries Supabase for the full session with exercises
 * and set_logs (including video_url), and returns:
 *   - session: a WorkoutSession-compatible object
 *   - prs: PRItem[] for sets flagged is_pr
 *   - videos: VideoItem[] for set_logs with non-null video_url
 *   - loading: boolean
 *
 * Per Pitfall 7 from RESEARCH.md: always fetches video_url from set_logs in
 * Supabase (not local storage) since videos are already uploaded at workout time.
 *
 * Per user decision: no time limit (any past workout can be shared),
 * re-sharing is allowed.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { WorkoutSession, SessionExercise, SetLog } from '@/features/workout/types';
import type { PRItem, VideoItem } from '@/features/social/hooks/useShareFlow';

export interface RetroactiveShareData {
  /** WorkoutSession-compatible object built from the historical session */
  session: WorkoutSession | null;
  /** PR items from set_logs with is_pr = true */
  prs: PRItem[];
  /** Video items from set_logs with non-null video_url */
  videos: VideoItem[];
  /** The original workout date (for the workout_date payload field) */
  workoutDate: string | null;
  loading: boolean;
  /** Re-fetch (useful after session mutations) */
  refetch: () => void;
}

export function useRetroactiveShare(sessionId: string | null): RetroactiveShareData {
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [prs, setPrs] = useState<PRItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [workoutDate, setWorkoutDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;

    const fetch = async () => {
      setLoading(true);
      try {
        // Fetch session with full nested data
        const { data, error } = await (supabase.from('workout_sessions') as any)
          .select(
            `
            id,
            user_id,
            plan_id,
            plan_day_id,
            title,
            started_at,
            ended_at,
            session_exercises(
              id,
              exercise_id,
              sort_order,
              exercises(name),
              set_logs(
                id,
                set_number,
                weight,
                reps,
                unit,
                is_pr,
                logged_at,
                video_url
              )
            )
          `
          )
          .eq('id', sessionId)
          .single();

        if (error || !data || cancelled) {
          if (!cancelled) {
            setLoading(false);
          }
          return;
        }

        // Build WorkoutSession-compatible exercises
        const rawExercises = (data.session_exercises ?? [])
          .sort((a: any, b: any) => a.sort_order - b.sort_order);

        const exercises: SessionExercise[] = rawExercises.map((se: any) => {
          const exerciseName: string = se.exercises?.name ?? 'Unknown';
          const setLogs: SetLog[] = (se.set_logs ?? [])
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((sl: any): SetLog => ({
              id: sl.id,
              set_number: sl.set_number,
              weight: sl.weight ?? 0,
              reps: sl.reps ?? 0,
              rpe: null,
              unit: (sl.unit ?? 'lbs') as 'kg' | 'lbs',
              is_pr: sl.is_pr ?? false,
              logged_at: sl.logged_at ?? '',
              video_url: sl.video_url ?? null,
            }));

          return {
            id: se.id,
            exercise_id: se.exercise_id,
            exercise_name: exerciseName,
            sort_order: se.sort_order,
            target_sets: [],
            weight_progression: 'manual',
            unit: setLogs[0]?.unit ?? 'lbs',
            logged_sets: setLogs,
          };
        });

        const builtSession: WorkoutSession = {
          id: data.id,
          user_id: data.user_id,
          plan_id: data.plan_id ?? null,
          plan_day_id: data.plan_day_id ?? null,
          title: data.title ?? 'Workout',
          started_at: data.started_at,
          ended_at: data.ended_at ?? null,
          exercises,
        };

        // Derive PRs: one entry per exercise that has at least one is_pr set,
        // using the highest weight PR set for the label
        const prItems: PRItem[] = [];
        for (const exercise of exercises) {
          const prSets = exercise.logged_sets.filter((sl) => sl.is_pr);
          if (prSets.length > 0) {
            const best = prSets.reduce((a, b) => (a.weight >= b.weight ? a : b));
            prItems.push({
              name: exercise.exercise_name,
              weight: best.weight,
              unit: best.unit,
            });
          }
        }

        // Derive videos: all set_logs with a non-null video_url
        const videoItems: VideoItem[] = [];
        for (const exercise of exercises) {
          for (const sl of exercise.logged_sets) {
            if (sl.video_url) {
              videoItems.push({
                exercise_name: exercise.exercise_name,
                exercise_id: exercise.exercise_id,
                set_index: sl.set_number - 1,
                set_number: sl.set_number,
                weight: sl.weight,
                reps: sl.reps,
                unit: sl.unit,
                video_url: sl.video_url,
              });
            }
          }
        }

        if (!cancelled) {
          setSession(builtSession);
          setPrs(prItems);
          setVideos(videoItems);
          // Use ended_at if available, otherwise started_at, as the original workout date
          setWorkoutDate(data.ended_at ?? data.started_at);
        }
      } catch (err) {
        console.warn('useRetroactiveShare: failed to fetch session:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetch();

    return () => {
      cancelled = true;
    };
  }, [sessionId, fetchKey]);

  return { session, prs, videos, workoutDate, loading, refetch };
}
