/**
 * Shared module-level bridge between useWorkoutSession and the summary screen.
 * Extracted to break the require cycle:
 *   useWorkoutSession -> summary -> useWorkoutSession
 *
 * All three callers import from here instead of from each other.
 */
import type { WorkoutSession } from '@/features/workout/types';

// --- Completed session handoff ---
// Set by useWorkoutSession.finishWorkout() before navigating to summary.
let _completedSession: WorkoutSession | null = null;

export function setCompletedSession(session: WorkoutSession) {
  _completedSession = session;
}

export function getCompletedSession(): WorkoutSession | null {
  return _completedSession;
}

export function clearCompletedSession() {
  _completedSession = null;
}

// --- Finishing flag ---
// Prevents the "no session" redirect from racing with navigation to summary.
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
