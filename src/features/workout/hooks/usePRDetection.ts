/**
 * PR detection hook and pure function.
 * Compares logged weight against stored baselines and detects personal records.
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useExerciseStore } from '@/stores/exerciseStore';
import { useAuthStore } from '@/stores/authStore';
import { notifyCoachPR } from '@/features/coaching/utils/notifyCoach';

export interface PRBaseline {
  exercise_id: string;
  weight: number;
  unit: string;
}

/** Raw row from Supabase pr_baselines (exercise_id may be null for manually-set PRs) */
interface PRBaselineRow {
  exercise_id: string | null;
  exercise_name: string | null;
  weight: number;
  unit: string;
}

/**
 * Slug-to-display-name mapping for Big 3 exercises.
 * Manually-set PRs store exercise_name as a slug (e.g., 'squat'),
 * while the exercises table uses display names (e.g., 'Squat').
 */
const EXERCISE_SLUG_TO_NAME: Record<string, string> = {
  bench_press: 'Bench Press',
  squat: 'Squat',
  deadlift: 'Deadlift',
};

export interface PRResult {
  isPR: boolean;
  previousBest: number | null;
}

/**
 * Pure function: check if a logged weight is a PR for a given exercise.
 *
 * - If exercise does not track PRs, returns { isPR: false, previousBest: null }
 * - If no baseline exists and exercise tracks PRs, returns { isPR: true, previousBest: null } (first-time baseline)
 * - If loggedWeight > baseline.weight, returns { isPR: true, previousBest: baseline.weight }
 * - If loggedWeight <= baseline.weight, returns { isPR: false, previousBest: baseline.weight }
 */
export function checkForPR(
  exerciseId: string,
  loggedWeight: number,
  prBaselines: PRBaseline[],
  tracksPR: boolean
): PRResult {
  if (!tracksPR) {
    return { isPR: false, previousBest: null };
  }

  const baseline = prBaselines.find((b) => b.exercise_id === exerciseId);

  if (!baseline) {
    // First time logging this PR-tracked exercise
    return { isPR: true, previousBest: null };
  }

  if (loggedWeight > baseline.weight) {
    return { isPR: true, previousBest: baseline.weight };
  }

  return { isPR: false, previousBest: baseline.weight };
}

/**
 * Hook for PR detection during an active workout session.
 * Loads baselines on mount, maintains session-local PR cache,
 * and provides detectPR function for set logging.
 */
export function usePRDetection(userId: string | undefined) {
  const [baselines, setBaselines] = useState<PRBaseline[]>([]);
  const sessionPRCacheRef = useRef<Map<string, number>>(new Map());
  const exercises = useExerciseStore((s) => s.exercises);

  // Load PR baselines from Supabase on mount.
  // Resolves exercise_id from exercise_name for manually-set PRs where exercise_id is null.
  const loadBaselines = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await (supabase as any)
        .from('pr_baselines')
        .select('exercise_id, exercise_name, weight, unit')
        .eq('user_id', userId);
      if (data) {
        const rows = data as PRBaselineRow[];
        const currentExercises = useExerciseStore.getState().exercises;
        const resolved: PRBaseline[] = [];
        const seenIds = new Set<string>();

        for (const row of rows) {
          let eid = row.exercise_id;

          // Resolve exercise_id from exercise_name when missing (manually-set PRs)
          if (!eid && row.exercise_name) {
            const displayName =
              EXERCISE_SLUG_TO_NAME[row.exercise_name] ?? row.exercise_name;
            const match = currentExercises.find(
              (e) =>
                e.name.toLowerCase() === displayName.toLowerCase()
            );
            eid = match?.id ?? null;
          }

          if (eid) {
            if (seenIds.has(eid)) {
              // Duplicate exercise_id (manual + workout rows): keep the higher weight
              const existing = resolved.find((r) => r.exercise_id === eid);
              if (existing && row.weight > existing.weight) {
                existing.weight = row.weight;
              }
            } else {
              seenIds.add(eid);
              resolved.push({
                exercise_id: eid,
                weight: row.weight,
                unit: row.unit,
              });
            }
          }
        }

        setBaselines(resolved);
      }
    } catch (e) {
      console.warn('PR baseline load failed:', e);
    }
  }, [userId]);

  /**
   * Detect if a logged weight is a PR.
   * Updates session cache and enqueues Supabase upsert if PR detected.
   */
  const detectPR = useCallback(
    async (
      exerciseId: string,
      weight: number,
      unit: 'kg' | 'lbs'
    ): Promise<PRResult> => {
      const exercise = exercises.find((e) => e.id === exerciseId);
      const tracksPR = exercise?.track_prs ?? false;

      // Build effective baselines: merge stored baselines with session cache
      const effectiveBaselines = baselines.map((b) => {
        const sessionWeight = sessionPRCacheRef.current.get(b.exercise_id);
        if (sessionWeight !== undefined && sessionWeight > b.weight) {
          return { ...b, weight: sessionWeight };
        }
        return b;
      });

      // Also check if session cache has an entry not in baselines
      const sessionCacheWeight = sessionPRCacheRef.current.get(exerciseId);
      const hasBaseline = effectiveBaselines.some(
        (b) => b.exercise_id === exerciseId
      );
      if (!hasBaseline && sessionCacheWeight !== undefined) {
        effectiveBaselines.push({
          exercise_id: exerciseId,
          weight: sessionCacheWeight,
          unit,
        });
      }

      const result = checkForPR(exerciseId, weight, effectiveBaselines, tracksPR);

      if (result.isPR) {
        // Update session PR cache
        sessionPRCacheRef.current.set(exerciseId, weight);

        // Fire-and-forget: notify coaches of PR
        if (userId) {
          const userName = useAuthStore.getState().displayName;
          const exerciseName = exercise?.name ?? 'Unknown';
          notifyCoachPR(userId, userName, exerciseName, exerciseId).catch(() => {});
        }

        // Enqueue Supabase upsert (fire-and-forget)
        if (userId) {
          (supabase as any)
            .from('pr_baselines')
            .upsert(
              {
                user_id: userId,
                exercise_id: exerciseId,
                exercise_name: exercise?.name ?? 'Unknown',
                weight,
                unit,
              },
              { onConflict: 'user_id,exercise_id' }
            )
            .then(() => {
              // Also update local baselines state
              setBaselines((prev) => {
                const existing = prev.findIndex(
                  (b) => b.exercise_id === exerciseId
                );
                if (existing >= 0) {
                  const updated = [...prev];
                  updated[existing] = { ...updated[existing], weight };
                  return updated;
                }
                return [
                  ...prev,
                  { exercise_id: exerciseId, weight, unit },
                ];
              });
            })
            .catch(() => {
              // Silently fail - local cache is source of truth
            });
        }
      }

      return result;
    },
    [baselines, exercises, userId]
  );

  return {
    detectPR,
    loadBaselines,
    sessionPRCache: sessionPRCacheRef.current,
  };
}
