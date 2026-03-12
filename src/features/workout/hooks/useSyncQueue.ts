/**
 * MMKV-backed sync queue for offline-first workout data persistence.
 * Buffers Supabase writes in MMKV and flushes when online.
 */
import { useEffect } from 'react';
import { createMMKV } from 'react-native-mmkv';
import NetInfo from '@react-native-community/netinfo';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkoutSession } from '@/features/workout/types';
import { calculateEpley1RM } from '@/features/history/utils/epley';

// Named MMKV instance for sync queue
const syncStorage = createMMKV({ id: 'sync-queue' });

const PENDING_KEY = 'pending';

export interface SyncItem {
  id: string;
  table: string;
  operation: 'insert' | 'upsert';
  data: Record<string, unknown>;
  created_at: string;
}

/** Read the current pending queue from MMKV */
export function getPendingQueue(): SyncItem[] {
  const raw = syncStorage.getString(PENDING_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SyncItem[];
  } catch {
    return [];
  }
}

/** Clear the pending queue (used for testing) */
export function clearPendingQueue(): void {
  syncStorage.set(PENDING_KEY, JSON.stringify([]));
}

/** Append a sync item to the pending queue in MMKV */
export function enqueueSyncItem(item: SyncItem): void {
  const queue = getPendingQueue();
  queue.push(item);
  syncStorage.set(PENDING_KEY, JSON.stringify(queue));
}

/** Process all pending items; failed items remain in queue */
export async function flushSyncQueue(supabase: SupabaseClient): Promise<void> {
  const netState = await NetInfo.fetch();
  if (!netState.isConnected) return;

  const queue = getPendingQueue();
  if (queue.length === 0) return;

  const failed: SyncItem[] = [];
  for (const item of queue) {
    const { error } = await (supabase as any)
      .from(item.table)
      [item.operation](item.data);
    if (error) {
      failed.push(item);
    }
  }
  syncStorage.set(PENDING_KEY, JSON.stringify(failed));
}

/** Generate a simple UUID v4 */
function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Break a completed session into sync items and enqueue them all.
 * Creates: 1 workout_sessions insert + N session_exercises inserts + M set_logs inserts.
 */
export function enqueueCompletedSession(session: WorkoutSession): void {
  const now = new Date().toISOString();

  // 1. Enqueue the workout session
  enqueueSyncItem({
    id: generateId(),
    table: 'workout_sessions',
    operation: 'insert',
    data: {
      id: session.id,
      user_id: session.user_id,
      plan_id: session.plan_id,
      plan_day_id: session.plan_day_id,
      started_at: session.started_at,
      ended_at: session.ended_at,
    },
    created_at: now,
  });

  // 2. Enqueue each session exercise
  for (const exercise of session.exercises) {
    enqueueSyncItem({
      id: generateId(),
      table: 'session_exercises',
      operation: 'insert',
      data: {
        id: exercise.id,
        session_id: session.id,
        exercise_id: exercise.exercise_id,
        sort_order: exercise.sort_order,
      },
      created_at: now,
    });

    // 3. Enqueue each set log
    for (const set of exercise.logged_sets) {
      enqueueSyncItem({
        id: generateId(),
        table: 'set_logs',
        operation: 'insert',
        data: {
          id: set.id,
          session_exercise_id: exercise.id,
          set_number: set.set_number,
          weight: set.weight,
          reps: set.reps,
          unit: set.unit,
          is_pr: set.is_pr,
          estimated_1rm: calculateEpley1RM(set.weight, set.reps),
          logged_at: set.logged_at,
        },
        created_at: now,
      });
    }
  }
}

/**
 * Hook that auto-flushes the sync queue when connectivity is restored.
 * Should be mounted at the app layout level.
 */
export function useSyncQueue(supabase: SupabaseClient): void {
  useEffect(() => {
    // Flush on mount (in case items are pending from a previous session)
    flushSyncQueue(supabase).catch(() => {
      // Silently ignore flush errors on mount
    });

    // Subscribe to connectivity changes and flush when online
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        flushSyncQueue(supabase).catch(() => {
          // Silently ignore flush errors
        });
      }
    });

    return unsubscribe;
  }, [supabase]);
}
