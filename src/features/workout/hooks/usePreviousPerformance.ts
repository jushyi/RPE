/**
 * Previous performance hook and cache utilities.
 * Uses MMKV for instant access to last session's set data per exercise.
 */
import { useState, useEffect } from 'react';
import { createMMKV } from 'react-native-mmkv';
import type { PreviousPerformance } from '@/features/workout/types';

// Named MMKV instance for previous performance cache
const storage = createMMKV({ id: 'previous-performance-cache' });

/** Cache key for a given exercise ID */
function cacheKey(exerciseId: string): string {
  return `prev-perf:${exerciseId}`;
}

/**
 * Read previous performance from MMKV cache.
 * Returns null if no cached data exists.
 */
export function getPreviousPerformance(
  exerciseId: string
): PreviousPerformance | null {
  const raw = storage.getString(cacheKey(exerciseId));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PreviousPerformance;
  } catch {
    return null;
  }
}

/**
 * Write previous performance data to MMKV cache.
 * Called after session completion to populate cache for next workout.
 */
export function cachePreviousPerformance(
  exerciseId: string,
  data: PreviousPerformance
): void {
  storage.set(cacheKey(exerciseId), JSON.stringify(data));
}

/**
 * Hook that provides previous performance data for a given exercise.
 * Reads from MMKV cache (no loading spinner needed).
 */
export function usePreviousPerformance(exerciseId: string) {
  const [previousSets, setPreviousSets] = useState<PreviousPerformance | null>(
    () => getPreviousPerformance(exerciseId)
  );

  useEffect(() => {
    const data = getPreviousPerformance(exerciseId);
    setPreviousSets(data);
  }, [exerciseId]);

  return { previousSets, isLoading: false };
}
