/**
 * Share payload builders for the three shareable content types:
 * workout summaries, personal records, and set videos.
 */

import type { WorkoutSession } from '@/features/workout/types';
import type {
  WorkoutSharePayload,
  PRSharePayload,
  VideoSharePayload,
} from '@/features/social/types';

/** Wrapped workout share payload with content_type discriminator */
export interface WorkoutShareItem {
  content_type: 'workout';
  payload: WorkoutSharePayload;
}

/** Wrapped PR share payload with content_type discriminator */
export interface PRShareItem {
  content_type: 'pr';
  payload: PRSharePayload;
}

/** Wrapped video share payload with content_type discriminator */
export interface VideoShareItem {
  content_type: 'video';
  payload: VideoSharePayload;
}

/**
 * Build a workout summary share payload from a completed session.
 * Computes exercise names, total sets, total volume, and duration.
 */
export function buildWorkoutPayload(session: WorkoutSession): WorkoutShareItem {
  const exercise_names = session.exercises.map((e) => e.exercise_name);

  let total_sets = 0;
  let total_volume = 0;

  for (const exercise of session.exercises) {
    total_sets += exercise.logged_sets.length;
    for (const set of exercise.logged_sets) {
      total_volume += set.weight * set.reps;
    }
  }

  let duration_minutes = 0;
  if (session.ended_at) {
    const startMs = new Date(session.started_at).getTime();
    const endMs = new Date(session.ended_at).getTime();
    duration_minutes = Math.round((endMs - startMs) / 60000);
  }

  return {
    content_type: 'workout',
    payload: {
      exercise_names,
      total_sets,
      total_volume,
      duration_minutes,
    },
  };
}

/**
 * Build a PR share payload.
 */
export function buildPRPayload(
  exercise_name: string,
  weight: number,
  reps: number,
  unit: 'kg' | 'lbs'
): PRShareItem {
  return {
    content_type: 'pr',
    payload: {
      exercise_name,
      weight,
      reps,
      unit,
    },
  };
}

/**
 * Build a set video share payload.
 * References an existing video URL from Supabase Storage (no re-upload).
 */
export function buildVideoPayload(
  video_url: string,
  exercise_name: string,
  weight: number,
  reps: number,
  unit: 'kg' | 'lbs',
  set_number: number
): VideoShareItem {
  return {
    content_type: 'video',
    payload: {
      video_url,
      exercise_name,
      weight,
      reps,
      unit,
      set_number,
    },
  };
}
