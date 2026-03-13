/**
 * MMKV-backed bridge between useWorkoutSession and the summary screen.
 * Extracted to break the require cycle:
 *   useWorkoutSession -> summary -> useWorkoutSession
 *
 * Uses MMKV persistence so the completed session survives HMR and
 * module re-evaluation (the old module-level variable was lost on hot reload).
 */
import { createMMKV } from 'react-native-mmkv';
import type { WorkoutSession } from '@/features/workout/types';

const bridgeStorage = createMMKV({ id: 'workout-bridge' });
const SESSION_KEY = 'completed_session';

// --- Completed session handoff ---
// Set by useWorkoutSession.finishWorkout() before navigating to summary.

export function setCompletedSession(session: WorkoutSession) {
  bridgeStorage.set(SESSION_KEY, JSON.stringify(session));
}

export function getCompletedSession(): WorkoutSession | null {
  try {
    const raw = bridgeStorage.getString(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WorkoutSession;
  } catch {
    return null;
  }
}

export function clearCompletedSession() {
  bridgeStorage.remove(SESSION_KEY);
}

// --- Finishing flag ---
// Prevents the "no session" redirect from racing with navigation to summary.
// Kept as module-level variable (only needs to survive within a single navigation transition).
let _isFinishing = false;

export function isWorkoutFinishing(): boolean {
  return _isFinishing;
}

export function setIsFinishing(value: boolean) {
  _isFinishing = value;
}

export function resetFinishingFlag() {
  _isFinishing = false;
}
