/**
 * PR detection hook and pure function.
 * Compares logged weight against stored baselines and detects personal records.
 */
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useExerciseStore } from '@/stores/exerciseStore';

export interface PRBaseline {
  exercise_id: string;
  weight: number;
  unit: string;
}

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

  // Load PR baselines from Supabase on mount
  const loadBaselines = useCallback(async () => {
    if (!userId) return;
    try {
      const { data } = await (supabase as any)
        .from('pr_baselines')
        .select('exercise_id, weight, unit')
        .eq('user_id', userId);
      if (data) {
        setBaselines(data as PRBaseline[]);
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
      weight: number
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
          unit: 'lbs',
        });
      }

      const result = checkForPR(exerciseId, weight, effectiveBaselines, tracksPR);

      if (result.isPR) {
        // Update session PR cache
        sessionPRCacheRef.current.set(exerciseId, weight);

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
                unit: 'lbs',
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
                  { exercise_id: exerciseId, weight, unit: 'lbs' },
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
