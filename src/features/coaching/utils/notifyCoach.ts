/**
 * Fire-and-forget notification helpers for notifying coaches.
 * Failures are logged but never thrown -- notification errors must not block primary actions.
 */
import { supabase } from '@/lib/supabase/client';

/**
 * Notify all coaches of a trainee when a workout is completed.
 * Called after workout finish flow.
 */
export async function notifyCoachWorkoutComplete(
  traineeId: string,
  traineeName: string,
  workoutTitle: string,
  hasPR: boolean,
  sessionId?: string
): Promise<void> {
  try {
    if (!supabase) return;

    // Find coaches for this trainee
    const { data: relationships, error: relError } = await (supabase as any)
      .from('coaching_relationships')
      .select('coach_id')
      .eq('trainee_id', traineeId);

    if (relError || !relationships?.length) return;

    const coachIds = relationships.map((r: { coach_id: string }) => r.coach_id);

    await supabase.functions.invoke('send-push', {
      body: {
        recipient_ids: coachIds,
        title: hasPR ? 'PR Alert' : 'Workout Complete',
        body: `${traineeName} finished ${workoutTitle}`,
        data: { type: 'workout_complete', trainee_id: traineeId, session_id: sessionId },
      },
    });
  } catch (err) {
    console.warn('Failed to notify coach (workout complete):', err);
  }
}

/**
 * Notify all coaches of a trainee when a PR is detected mid-workout.
 * Sends a real-time notification separate from the workout-complete summary.
 */
export async function notifyCoachPR(
  traineeId: string,
  traineeName: string,
  exerciseName: string,
  exerciseId?: string
): Promise<void> {
  try {
    if (!supabase) return;

    // Find coaches for this trainee
    const { data: relationships, error: relError } = await (supabase as any)
      .from('coaching_relationships')
      .select('coach_id')
      .eq('trainee_id', traineeId);

    if (relError || !relationships?.length) return;

    const coachIds = relationships.map((r: { coach_id: string }) => r.coach_id);

    await supabase.functions.invoke('send-push', {
      body: {
        recipient_ids: coachIds,
        title: 'New PR',
        body: `${traineeName} hit a PR on ${exerciseName}`,
        data: { type: 'pr_achieved', trainee_id: traineeId, trainee_name: traineeName, exercise_id: exerciseId, exercise_name: exerciseName },
      },
    });
  } catch (err) {
    console.warn('Failed to notify coach (PR):', err);
  }
}
